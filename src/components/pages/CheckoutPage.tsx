import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useGiftCart } from '#/contexts/GiftCartContext'
import { useDonorAuth } from '#/contexts/DonorAuthContext'
import { createCheckoutSession } from '#/lib/commerce/createCheckoutSession'
import { createPayPalCheckout } from '#/lib/commerce/createPayPalOrder'
import { getCheckoutErrorMessage } from '#/lib/commerce/checkoutErrors'
import { getPublicPaymentOptions } from '#/lib/integrations/integrationSettingsApi'
import { GiftLineItem } from '#/components/commerce/GiftLineItem'
import { PaymentMethodSelector, type PaymentMethod } from '#/components/commerce/PaymentMethodSelector'
import { PageHero } from '#/components/layout/PageHero'
import { Container } from '#/components/ui/container'
import { Button } from '#/components/ui/button'
import { formatPrice } from '#/lib/utils'
import type { TrustBlock } from '#/lib/cms/types'
import { BankPaymentSection } from '#/components/sections/trust/BankPaymentSection'
import { PostageFootnote } from '#/components/commerce/PostageFootnote'

type CheckoutPageProps = {
  bankBlock?: TrustBlock
  postageNote?: TrustBlock
}

export function CheckoutPage({ bankBlock, postageNote }: CheckoutPageProps) {
  const { cart, subtotal, itemCount } = useGiftCart()
  const { user, profile, session } = useDonorAuth()
  const currency = cart.items[0]?.currency ?? 'GBP'
  const needsShipping = cart.items.some((i) => i.requiresShipping)

  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [dedication, setDedication] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [createAccount, setCreateAccount] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe')
  const [stripeEnabled, setStripeEnabled] = useState(true)
  const [paypalEnabled, setPaypalEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    'rounded-xl border border-dq-border px-4 py-3 text-dq-black outline-none focus:border-dq-gold focus:ring-2 focus:ring-dq-gold/20'

  useEffect(() => {
    void getPublicPaymentOptions().then((options) => {
      setStripeEnabled(options.stripeEnabled)
      setPaypalEnabled(options.paypalEnabled)
      if (!options.stripeEnabled && options.paypalEnabled) {
        setPaymentMethod('paypal')
      }
    })
  }, [])

  useEffect(() => {
    if (user) {
      setDonorEmail(user.email ?? '')
      if (profile?.fullName) setDonorName(profile.fullName)
      if (profile?.phone) setDonorPhone(profile.phone)
    }
  }, [user, profile])

  const checkoutPayload = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return {
      items: cart.items,
      donorName,
      donorEmail,
      donorPhone: donorPhone || undefined,
      dedication: dedication || undefined,
      shippingAddress: needsShipping
        ? { line1, line2: line2 || undefined, city, state, postalCode, country }
        : null,
      donorUserId: session?.user?.id ?? null,
      successUrl: `${origin}/donate/checkout/success`,
      cancelUrl: `${origin}/donate/checkout/cancel`,
    }
  }

  async function handleCheckout() {
    setBusy(true)
    setError(null)
    try {
      const payload = checkoutPayload()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''

      if (createAccount && typeof window !== 'undefined') {
        sessionStorage.setItem('dq-create-account', '1')
      }

      if (paymentMethod === 'paypal') {
        const result = await createPayPalCheckout({
          data: {
            ...payload,
            returnUrl: `${origin}/donate/checkout/paypal-return`,
            cancelUrl: payload.cancelUrl,
          },
        })
        window.location.href = result.url
        return
      }

      const result = await createCheckoutSession({ data: payload })
      window.location.href = result.url
    } catch (e) {
      setError(getCheckoutErrorMessage(e))
      setBusy(false)
    }
  }

  if (!cart.items.length) {
    return (
      <section className="py-16">
        <Container className="text-center">
          <p className="type-body text-dq-muted">Your gift is empty.</p>
          <Button asChild variant="gold" className="mt-4">
            <Link to="/donate">BROWSE GIFTS</Link>
          </Button>
        </Container>
      </section>
    )
  }

  const onlinePaymentAvailable = stripeEnabled || paypalEnabled

  return (
    <>
      <PageHero
        eyebrow="Complete your gift"
        title="Your"
        highlight="Donation"
        description="Enter your details below to complete your gift. Payment is processed securely as a donation."
        variant="cream"
      />
      <section className="pt-10 md:pt-12 pb-16 md:pb-24">
        <Container>
          <Link
            to="/donate/cart"
            className="type-label mb-8 inline-flex items-center gap-2 text-dq-muted hover:text-dq-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to your gift
          </Link>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8">
              <div className="rounded-2xl border border-dq-border bg-white p-6">
                <h2 className="type-title mb-4 text-dq-black">Your details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="type-label mb-2 block" htmlFor="donorName">
                      Full name *
                    </label>
                    <input id="donorName" required className={inputClass + ' w-full'} value={donorName} onChange={(e) => setDonorName(e.target.value)} />
                  </div>
                  <div>
                    <label className="type-label mb-2 block" htmlFor="donorEmail">
                      Email *
                    </label>
                    <input id="donorEmail" type="email" required className={inputClass + ' w-full'} value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="type-label mb-2 block" htmlFor="donorPhone">
                      Phone
                    </label>
                    <input id="donorPhone" type="tel" className={inputClass + ' w-full'} value={donorPhone} onChange={(e) => setDonorPhone(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="type-label mb-2 block" htmlFor="dedication">
                      Gift dedication (optional)
                    </label>
                    <input id="dedication" className={inputClass + ' w-full'} placeholder="In honor of / In memory of" value={dedication} onChange={(e) => setDedication(e.target.value)} />
                  </div>
                </div>
              </div>

              {needsShipping ? (
                <div className="rounded-2xl border border-dq-border bg-white p-6">
                  <h2 className="type-title mb-4 text-dq-black">Delivery details</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <input className={inputClass + ' w-full'} placeholder="Address line 1 *" value={line1} onChange={(e) => setLine1(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <input className={inputClass + ' w-full'} placeholder="Address line 2" value={line2} onChange={(e) => setLine2(e.target.value)} />
                    </div>
                    <input className={inputClass} placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} />
                    <input className={inputClass} placeholder="State *" value={state} onChange={(e) => setState(e.target.value)} />
                    <input className={inputClass} placeholder="Postal code *" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                    <input className={inputClass} placeholder="Country *" value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>
              ) : null}

              {onlinePaymentAvailable ? (
                <PaymentMethodSelector
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  stripeEnabled={stripeEnabled}
                  paypalEnabled={paypalEnabled}
                />
              ) : null}

              {!user && onlinePaymentAvailable ? (
                <label className="flex items-start gap-3 rounded-xl border border-dq-border bg-dq-cream/20 p-4">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={createAccount}
                    onChange={(e) => setCreateAccount(e.target.checked)}
                  />
                  <span className="text-sm text-dq-muted">
                    Create an account to track your gift history. You can set a password after completing your gift.
                  </span>
                </label>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              {onlinePaymentAvailable ? (
                <Button variant="gold" size="lg" className="w-full md:w-auto" disabled={busy} onClick={() => void handleCheckout()}>
                  {busy ? 'REDIRECTING TO PAYMENT...' : 'COMPLETE YOUR GIFT'}
                </Button>
              ) : (
                <p className="text-sm text-dq-muted">
                  Online payment is not available right now. Please use bank transfer below to complete your gift.
                </p>
              )}
            </div>

            <aside className="h-fit rounded-2xl border-2 border-dq-gold/60 bg-white p-6">
              <h2 className="type-title mb-4 text-dq-black">Gift summary</h2>
              {cart.items.map((item) => (
                <GiftLineItem key={item.productId} item={item} />
              ))}
              <div className="mt-4 flex justify-between border-t border-dq-border pt-4">
                <span className="type-label text-dq-muted">{itemCount} items</span>
                <span className="type-title">{subtotal > 0 ? formatPrice(subtotal, currency) : '—'}</span>
              </div>
              {needsShipping ? (
                <PostageFootnote block={postageNote} className="mt-4 border-t border-dq-border pt-4" />
              ) : null}
            </aside>
          </div>
        </Container>
      </section>

      {bankBlock ? <BankPaymentSection block={bankBlock} /> : null}
    </>
  )
}
