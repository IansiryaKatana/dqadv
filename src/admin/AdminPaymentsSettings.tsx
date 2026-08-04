import { useCallback, useEffect, useState } from 'react'
import { useAdminAuth } from '#/contexts/AdminAuthContext'
import {
  getMaskedIntegrationSettings,
  saveIntegrationSettingsFn,
  testPayPalConnection,
  testResendConnection,
  testStripeConnection,
} from '#/lib/integrations/integrationSettingsApi'
import type { MaskedIntegrationSettings } from '#/lib/integrations/types'
import { cn } from '#/lib/utils'
import { AdminSelect } from './components/AdminSelect'
import { ADMIN_PAYPAL_MODE_OPTIONS, ADMIN_STRIPE_MODE_OPTIONS } from './adminSelectOptions'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#737373]">{children}</label>
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
      )}
    >
      {label}
    </span>
  )
}

export function AdminPaymentsSettings() {
  const { session } = useAdminAuth()
  const [settings, setSettings] = useState<MaskedIntegrationSettings | null>(null)
  const [stripePublishableKey, setStripePublishableKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('')
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test')
  const [stripeEnabled, setStripeEnabled] = useState(true)
  const [paypalClientId, setPaypalClientId] = useState('')
  const [paypalClientSecret, setPaypalClientSecret] = useState('')
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>('sandbox')
  const [paypalEnabled, setPaypalEnabled] = useState(false)
  const [resendApiKey, setResendApiKey] = useState('')
  const [emailFromName, setEmailFromName] = useState('Donate Quran')
  const [emailFromAddress, setEmailFromAddress] = useState('')
  const [emailAdminNotify, setEmailAdminNotify] = useState('')
  const [testEmailTo, setTestEmailTo] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [testBusy, setTestBusy] = useState<'stripe' | 'paypal' | 'resend' | null>(null)
  const [resendTestSent, setResendTestSent] = useState(false)

  const load = useCallback(async () => {
    if (!session?.access_token) return
    const data = await getMaskedIntegrationSettings({ data: { accessToken: session.access_token } })
    setSettings(data)
    setStripePublishableKey(data.stripePublishableKey)
    setStripeMode(data.stripeMode)
    setStripeEnabled(data.stripeEnabled)
    setPaypalClientId(data.paypalClientId)
    setPaypalMode(data.paypalMode)
    setPaypalEnabled(data.paypalEnabled)
    setEmailFromName(data.emailFromName)
    setEmailFromAddress(data.emailFromAddress)
    setEmailAdminNotify(data.emailAdminNotify)
  }, [session])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    if (!session?.access_token) return
    setBusy(true)
    setErr(null)
    setMsg(null)
    try {
      const updated = await saveIntegrationSettingsFn({
        data: {
          accessToken: session.access_token,
          keepSecrets: true,
          settings: {
            stripePublishableKey,
            stripeSecretKey,
            stripeWebhookSecret,
            stripeMode,
            stripeEnabled,
            paypalClientId,
            paypalClientSecret,
            paypalMode,
            paypalEnabled,
            resendApiKey,
            emailFromName,
            emailFromAddress,
            emailAdminNotify,
          },
        },
      })
      setSettings(updated)
      setStripeSecretKey('')
      setStripeWebhookSecret('')
      setPaypalClientSecret('')
      setResendApiKey('')
      setMsg('Payment and email settings saved.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setBusy(false)
    }
  }

  async function runTest(kind: 'stripe' | 'paypal' | 'resend') {
    if (!session?.access_token || testBusy) return
    setErr(null)
    setMsg(null)
    if (kind === 'resend') setResendTestSent(false)
    setTestBusy(kind)
    try {
      if (kind === 'stripe') {
        await testStripeConnection({
          data: { accessToken: session.access_token, secretKey: stripeSecretKey || undefined },
        })
        setMsg('Stripe connection successful.')
      }
      if (kind === 'paypal') {
        await testPayPalConnection({ data: { accessToken: session.access_token } })
        setMsg('PayPal connection successful.')
      }
      if (kind === 'resend') {
        if (!testEmailTo.trim()) throw new Error('Enter a test email address.')
        await testResendConnection({ data: { accessToken: session.access_token, to: testEmailTo.trim() } })
        setResendTestSent(true)
        setMsg('Test email sent.')
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Test failed.')
    } finally {
      setTestBusy(null)
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-site.com'

  return (
    <div className="space-y-6">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}

      <div className="rounded-xl border border-[#e5e5e5] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-dq-black">Stripe</h3>
          <StatusBadge ok={settings?.stripeConfigured ?? false} label={settings?.stripeConfigured ? 'Configured' : 'Not configured'} />
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={stripeEnabled} onChange={(e) => setStripeEnabled(e.target.checked)} />
          Enable Stripe checkout
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Publishable key</FieldLabel>
            <input className="admin-input" value={stripePublishableKey} onChange={(e) => setStripePublishableKey(e.target.value)} placeholder="pk_test_..." />
          </div>
          <div>
            <FieldLabel>Mode</FieldLabel>
            <AdminSelect
              value={stripeMode}
              onValueChange={(value) => setStripeMode(value as 'test' | 'live')}
              options={ADMIN_STRIPE_MODE_OPTIONS}
            />
          </div>
          <div>
            <FieldLabel>Secret key</FieldLabel>
            <input className="admin-input" type="password" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} placeholder={settings?.stripeSecretKeyMasked || 'sk_test_...'} />
          </div>
          <div>
            <FieldLabel>Webhook secret</FieldLabel>
            <input className="admin-input" type="password" value={stripeWebhookSecret} onChange={(e) => setStripeWebhookSecret(e.target.value)} placeholder={settings?.stripeWebhookSecretMasked || 'whsec_...'} />
          </div>
        </div>
        <p className="admin-muted mt-3 text-xs">Webhook URL: {origin}/api/stripe-webhook</p>
        <button
          type="button"
          className="admin-btn-secondary mt-3"
          disabled={testBusy !== null}
          onClick={() => void runTest('stripe')}
        >
          {testBusy === 'stripe' ? 'Testing…' : 'Test Stripe'}
        </button>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-dq-black">PayPal</h3>
          <StatusBadge ok={settings?.paypalConfigured ?? false} label={settings?.paypalConfigured ? 'Configured' : 'Not configured'} />
        </div>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={paypalEnabled} onChange={(e) => setPaypalEnabled(e.target.checked)} />
          Enable PayPal checkout
        </label>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <FieldLabel>Client ID</FieldLabel>
            <input className="admin-input" value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} />
          </div>
          <div>
            <FieldLabel>Mode</FieldLabel>
            <AdminSelect
              value={paypalMode}
              onValueChange={(value) => setPaypalMode(value as 'sandbox' | 'live')}
              options={ADMIN_PAYPAL_MODE_OPTIONS}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Client secret</FieldLabel>
            <input className="admin-input" type="password" value={paypalClientSecret} onChange={(e) => setPaypalClientSecret(e.target.value)} placeholder={settings?.paypalClientSecretMasked || 'Secret'} />
          </div>
        </div>
        <p className="admin-muted mt-3 text-xs">
          Mode must match your keys: sandbox Client ID/Secret only work in Sandbox; live keys only work in Live.
        </p>
        <p className="admin-muted mt-1 text-xs">
          For guest card checkout (no PayPal login): in PayPal → Account Settings → Website payments → Website
          preferences, set “PayPal account optional” to On.
        </p>
        <p className="admin-muted mt-1 text-xs">Webhook URL: {origin}/api/paypal-webhook</p>
        <button
          type="button"
          className="admin-btn-secondary mt-3"
          disabled={testBusy !== null}
          onClick={() => void runTest('paypal')}
        >
          {testBusy === 'paypal' ? 'Testing…' : 'Test PayPal'}
        </button>
      </div>

      <div className="rounded-xl border border-[#e5e5e5] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-dq-black">Email (Resend)</h3>
          <StatusBadge ok={settings?.resendConfigured ?? false} label={settings?.resendConfigured ? 'Configured' : 'Not configured'} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel>Resend API key</FieldLabel>
            <input className="admin-input" type="password" value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} placeholder={settings?.resendApiKeyMasked || 're_...'} />
          </div>
          <div>
            <FieldLabel>From name</FieldLabel>
            <input className="admin-input" value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>From email</FieldLabel>
            <input className="admin-input" type="email" value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} placeholder="donations@yourdomain.com" />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Admin notification email</FieldLabel>
            <input className="admin-input" type="email" value={emailAdminNotify} onChange={(e) => setEmailAdminNotify(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Send test to</FieldLabel>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                className="admin-input flex-1"
                type="email"
                value={testEmailTo}
                onChange={(e) => {
                  setTestEmailTo(e.target.value)
                  if (resendTestSent) setResendTestSent(false)
                }}
                placeholder="you@example.com"
                disabled={testBusy === 'resend'}
              />
              <button
                type="button"
                className={cn(
                  'shrink-0 min-w-[7.5rem]',
                  resendTestSent && !testBusy ? 'admin-btn-primary' : 'admin-btn-secondary',
                )}
                disabled={testBusy !== null || !testEmailTo.trim()}
                onClick={() => void runTest('resend')}
                aria-busy={testBusy === 'resend'}
              >
                {testBusy === 'resend' ? 'Sending…' : resendTestSent ? 'Test sent' : 'Send test'}
              </button>
            </div>
            {resendTestSent && !testBusy ? (
              <p className="mt-2 text-sm text-emerald-700">Test email delivered — check the inbox for {testEmailTo.trim()}.</p>
            ) : null}
          </div>
        </div>
      </div>

      <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void handleSave()}>
        {busy ? 'Saving…' : 'Save payment & email settings'}
      </button>
    </div>
  )
}
