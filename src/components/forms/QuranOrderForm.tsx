import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { getCheckoutErrorMessage } from '#/lib/commerce/checkoutErrors'
import {
  MAX_BOX_QTY,
  MAX_COPY_QTY,
  UK_COUNTRY_NAME,
  quoteUkQuranOrder,
  type PostageBand,
  type PostageTier,
} from '#/lib/commerce/quoteUkQuranOrder'
import { getPublicPaymentOptions } from '#/lib/integrations/publicPaymentOptions'
import { PaymentMethodSelector, type PaymentMethod } from '#/components/commerce/PaymentMethodSelector'
import { Button } from '#/components/ui/button'
import { formControlClass } from '#/components/ui/form-controls'
import { formatPrice } from '#/lib/utils'
import type { TrustBlock } from '#/lib/cms/types'
import { PostageFootnote } from '#/components/commerce/PostageFootnote'

type QuranOrderFormProps = {
  tiers: PostageTier[]
  postageNote?: TrustBlock
  initialQuantity?: number
}

export function QuranOrderForm({ tiers, postageNote, initialQuantity = 1 }: QuranOrderFormProps) {
  const { user, profile, session } = useDonorAuth()
  const startBand: PostageBand = initialQuantity >= 10 ? 'boxes' : 'copies'
  const startQty =
    startBand === 'boxes'
      ? Math.min(MAX_BOX_QTY, Math.max(1, Math.round(initialQuantity / 10)))
      : Math.min(MAX_COPY_QTY, Math.max(1, initialQuantity))

  const [band, setBand] = useState<PostageBand>(startBand)
  const [quantity, setQuantity] = useState(startQty)
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
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

  const quote = useMemo(() => {
    try {
      return quoteUkQuranOrder(band, quantity, tiers)
    } catch {
      return null
    }
  }, [band, quantity, tiers])

  const maxQty = band === 'copies' ? MAX_COPY_QTY : MAX_BOX_QTY
  const onlinePaymentAvailable = stripeEnabled || paypalEnabled

  function switchBand(next: PostageBand) {
    setBand(next)
    setQuantity(1)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!quote) {
      setError('Choose 1–9 copies or 1–15 boxes.')
      return
    }
    setBusy(true)
    try {
      const origin = window.location.origin
      const { createQuranOrderCheckout } = await import('#/lib/commerce/createQuranOrderCheckout')
      const result = await createQuranOrderCheckout({
        data: {
          band,
          quantity,
          donorName,
          donorEmail,
          donorPhone: donorPhone || undefined,
          donorUserId: session?.user?.id ?? null,
          shippingAddress: {
            line1,
            line2: line2 || undefined,
            city,
            state,
            postalCode,
            country: UK_COUNTRY_NAME,
          },
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
    <form className="space-y-8" onSubmit={(e) => void onSubmit(e)}>
      <div>
        <p className="type-label mb-3 text-dq-black">Quantity</p>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium ${band === 'copies' ? 'border-dq-gold bg-dq-cream/40' : 'border-dq-border text-dq-muted'}`}
            onClick={() => switchBand('copies')}
          >
            Copies (1–9)
          </button>
          <button
            type="button"
            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium ${band === 'boxes' ? 'border-dq-gold bg-dq-cream/40' : 'border-dq-border text-dq-muted'}`}
            onClick={() => switchBand('boxes')}
          >
            Boxes of 10 (1–15)
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="size-6" strokeWidth={2.5} />
          </Button>
          <span className="type-title min-w-[3ch] text-center">{quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={quantity >= maxQty}
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus className="size-6" strokeWidth={2.5} />
          </Button>
          <span className="text-sm text-dq-muted">
            {band === 'copies' ? 'copies' : quantity === 1 ? 'box' : 'boxes'}
          </span>
        </div>
      </div>

      {quote ? (
        <div className="rounded-2xl border-2 border-dq-gold/50 bg-dq-cream/30 p-5">
          <p className="type-label text-dq-muted">{quote.label}</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Cost</dt>
              <dd className="font-medium">{quote.cost === 0 ? 'Free' : formatPrice(quote.cost, 'GBP')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Postage & packaging</dt>
              <dd className="font-medium">{formatPrice(quote.postage, 'GBP')}</dd>
            </div>
            <div className="flex justify-between border-t border-dq-border pt-2 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatPrice(quote.total, 'GBP')}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-dq-muted">
            {quote.copies === 1
              ? 'The Qur’an is free; you pay postage only.'
              : 'Includes a contribution to print cost plus postage.'}
          </p>
        </div>
      ) : null}

      <p className="text-sm text-dq-muted">
        Need 16 or more boxes, or a distribution channel?{' '}
        <Link to="/distribute" className="text-dq-gold hover:underline">
          Apply to distribute
        </Link>
        .
      </p>

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
        <input
          className={`${formControlClass} md:col-span-2`}
          placeholder="Phone (optional)"
          value={donorPhone}
          onChange={(e) => setDonorPhone(e.target.value)}
        />
      </div>

      <div>
        <h2 className="type-title mb-2 text-dq-black">UK delivery address</h2>
        <p className="mb-4 text-sm text-dq-muted">We currently post printed Qur’ans within the United Kingdom only.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className={`${formControlClass} md:col-span-2`}
            placeholder="Address line 1 *"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            required
          />
          <input
            className={`${formControlClass} md:col-span-2`}
            placeholder="Address line 2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
          />
          <input
            className={formControlClass}
            placeholder="City *"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
          <input
            className={formControlClass}
            placeholder="County *"
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
          />
          <input
            className={formControlClass}
            placeholder="Postcode *"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
          />
          <input className={formControlClass} value={UK_COUNTRY_NAME} readOnly aria-label="Country" />
        </div>
      </div>

      {postageNote ? <PostageFootnote block={postageNote} /> : null}

      {onlinePaymentAvailable ? (
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={setPaymentMethod}
          stripeEnabled={stripeEnabled}
          paypalEnabled={paypalEnabled}
        />
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant="gold" size="lg" disabled={busy || !paymentsReady || !onlinePaymentAvailable || !quote}>
        {busy
          ? 'REDIRECTING…'
          : !paymentsReady
            ? 'LOADING PAYMENT…'
            : quote
              ? `PAY ${formatPrice(quote.total, 'GBP')}`
              : 'PAY'}
      </Button>
    </form>
  )
}
