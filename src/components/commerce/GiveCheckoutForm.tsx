import { useEffect, useState } from 'react'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getCheckoutErrorMessage } from '#/lib/commerce/checkoutErrors'
import { DONATE_MAX_AMOUNT, DONATE_MIN_AMOUNT, type DonatePreset, type GiftFrequency } from '#/lib/commerce/donateAmounts'
import { getPublicPaymentOptions } from '#/lib/integrations/publicPaymentOptions'
import { PaymentMethodSelector, type PaymentMethod } from '#/components/commerce/PaymentMethodSelector'
import { Button } from '#/components/ui/button'
import { formControlClass } from '#/components/ui/form-controls'
import { cn, formatPrice } from '#/lib/utils'

type GiveCheckoutFormProps = {
  presets: DonatePreset[]
  compact?: boolean
  className?: string
}

export function GiveCheckoutForm({ presets, compact = false, className }: GiveCheckoutFormProps) {
  const { user, profile, session } = useDonorAuth()
  const [amount, setAmount] = useState(presets[0]?.amount ?? 25)
  const [custom, setCustom] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [frequency, setFrequency] = useState<GiftFrequency>('one_time')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [dedication, setDedication] = useState('')
  const [createAccount, setCreateAccount] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paypal')
  const [stripeEnabled, setStripeEnabled] = useState(false)
  const [paypalEnabled, setPaypalEnabled] = useState(false)
  const [paymentsReady, setPaymentsReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) setPaymentsReady(true)
    }, 15000)

    void getPublicPaymentOptions()
      .then((options) => {
        if (cancelled) return
        setStripeEnabled(options.stripeEnabled)
        setPaypalEnabled(options.paypalEnabled)
        if (options.paypalEnabled && !options.stripeEnabled) setPaymentMethod('paypal')
        else if (options.stripeEnabled && !options.paypalEnabled) setPaymentMethod('stripe')
        else if (options.paypalEnabled) setPaymentMethod('paypal')
        else if (options.stripeEnabled) setPaymentMethod('stripe')
      })
      .catch(() => {
        if (cancelled) return
        setStripeEnabled(false)
        setPaypalEnabled(false)
      })
      .finally(() => {
        window.clearTimeout(timeout)
        if (!cancelled) setPaymentsReady(true)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setDonorEmail(user.email ?? '')
      if (profile?.fullName) setDonorName(profile.fullName)
      if (profile?.phone) setDonorPhone(profile.phone)
    }
  }, [user, profile])

  const selectedAmount = custom ? Number(customValue) : amount
  const displayAmount = Number.isFinite(selectedAmount) && selectedAmount > 0 ? selectedAmount : 0
  const onlinePaymentAvailable = stripeEnabled || paypalEnabled

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!donorName.trim() || !donorEmail.trim()) {
      setError('Name and email are required.')
      return
    }
    if (!onlinePaymentAvailable) {
      setError('Online payment is temporarily unavailable. Please try again later or use bank transfer below.')
      return
    }
    setBusy(true)
    try {
      if (createAccount && typeof window !== 'undefined') {
        sessionStorage.setItem('dq-create-account', '1')
      }
      const origin = window.location.origin
      const { createGiveCheckout } = await import('#/lib/commerce/createGiveCheckout')
      const result = await createGiveCheckout({
        data: {
          amount: displayAmount,
          frequency,
          donorName,
          donorEmail,
          donorPhone: donorPhone || undefined,
          dedication: dedication || undefined,
          donorUserId: session?.user?.id ?? null,
          paymentMethod,
          successUrl: `${origin}/donate/checkout/success`,
          cancelUrl: `${origin}/donate/checkout/cancel`,
        },
      })
      if (result.url) window.location.assign(result.url)
    } catch (e) {
      setError(getCheckoutErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <form className={cn('space-y-6', className)} onSubmit={(e) => void onSubmit(e)}>
      <div>
        <p className="type-label mb-3 text-dq-black">Amount</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => {
            const active = !custom && amount === preset.amount
            return (
              <button
                key={preset.id}
                type="button"
                className={cn(
                  'rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'border-dq-gold bg-dq-gold text-dq-on-gold' : 'border-dq-border text-dq-black hover:border-dq-gold',
                )}
                onClick={() => {
                  setCustom(false)
                  setAmount(preset.amount)
                }}
              >
                {formatPrice(preset.amount, preset.currency)}
              </button>
            )
          })}
          <button
            type="button"
            className={cn(
              'rounded-full border-2 px-4 py-2 text-sm font-medium transition-colors',
              custom ? 'border-dq-gold bg-dq-gold text-dq-on-gold' : 'border-dq-border text-dq-black hover:border-dq-gold',
            )}
            onClick={() => setCustom(true)}
          >
            Other
          </button>
        </div>
        {custom ? (
          <div className="relative mt-3 max-w-xs">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dq-muted">£</span>
            <input
              className={cn(formControlClass, 'pl-8')}
              inputMode="decimal"
              min={DONATE_MIN_AMOUNT}
              max={DONATE_MAX_AMOUNT}
              placeholder="Custom amount"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              required
            />
          </div>
        ) : null}
      </div>

      <div>
        <p className="type-label mb-3 text-dq-black">Frequency</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'one_time' as const, label: 'One-time' },
            { id: 'monthly' as const, label: 'Monthly' },
          ]).map((option) => (
            <button
              key={option.id}
              type="button"
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors',
                frequency === option.id
                  ? 'border-dq-gold bg-dq-cream/40 text-dq-black'
                  : 'border-dq-border text-dq-muted hover:border-dq-gold/50',
              )}
              onClick={() => setFrequency(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          className={formControlClass}
          placeholder="Full name *"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          required
        />
        <input
          className={formControlClass}
          type="email"
          placeholder="Email *"
          value={donorEmail}
          onChange={(e) => setDonorEmail(e.target.value)}
          required
        />
        {compact ? null : (
          <>
            <input
              className={formControlClass}
              placeholder="Phone (optional)"
              value={donorPhone}
              onChange={(e) => setDonorPhone(e.target.value)}
            />
            <input
              className={formControlClass}
              placeholder="On behalf of (optional)"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
            />
          </>
        )}
      </div>

      {onlinePaymentAvailable ? (
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
          stripeEnabled={stripeEnabled}
          paypalEnabled={paypalEnabled}
        />
      ) : null}

      {!user && onlinePaymentAvailable && !compact ? (
        <label className="flex items-start gap-3 text-sm text-dq-muted">
          <input
            type="checkbox"
            className="mt-1"
            checked={createAccount}
            onChange={(e) => setCreateAccount(e.target.checked)}
          />
          Optional: create an account after payment to manage monthly gifts.
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" variant="gold" size="lg" disabled={busy || !paymentsReady || !onlinePaymentAvailable}>
          {busy
            ? 'REDIRECTING…'
            : !paymentsReady
              ? 'LOADING PAYMENT…'
              : `GIVE ${displayAmount > 0 ? formatPrice(displayAmount, 'GBP') : ''}`.trim()}
        </Button>
        {compact ? null : (
          <p className="text-sm text-dq-muted">
            {frequency === 'monthly' ? 'Repeats each month until you cancel.' : 'One-time gift. No shipping.'}
          </p>
        )}
      </div>
    </form>
  )
}
