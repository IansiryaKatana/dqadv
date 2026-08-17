import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { DonationProduct } from '#/lib/cms/types'
import { isFreeRequestProduct } from '#/lib/commerce/productFlags'
import { submitPublicForm } from '#/lib/forms/submitPublicForm'
import { Button } from '#/components/ui/button'
import { formControlClass } from '#/components/ui/form-controls'
import { FormSelect } from '#/components/ui/select'

export type FreeQuranRequestPayload = {
  productId: string
  productSlug: string
  productTitle: string
  quantity: number
  fullName: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  note: string
}

type FreeQuranRequestFormProps = {
  products: DonationProduct[]
  initialSlug?: string
  initialQuantity?: number
}

function Field({
  label,
  id,
  required = true,
  children,
}: {
  label: string
  id: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="type-label text-dq-black">
        {label}
        {required ? <span className="text-dq-gold"> *</span> : null}
      </label>
      {children}
    </div>
  )
}

export function FreeQuranRequestForm({
  products,
  initialSlug,
  initialQuantity = 1,
}: FreeQuranRequestFormProps) {
  const freeProducts = useMemo(() => products.filter(isFreeRequestProduct), [products])
  const defaultProduct =
    freeProducts.find((p) => p.slug === initialSlug) ?? freeProducts[0] ?? null

  const [productId, setProductId] = useState(defaultProduct?.id ?? '')
  const [quantity, setQuantity] = useState(Math.max(1, initialQuantity))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!productId && defaultProduct) setProductId(defaultProduct.id)
  }, [defaultProduct, productId])

  const selected = freeProducts.find((p) => p.id === productId) ?? defaultProduct
  const maxQty = selected?.maxQuantity ?? 99

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!selected) {
      setError('No free products are available right now.')
      return
    }
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !state.trim() ||
      !postalCode.trim() ||
      !country.trim()
    ) {
      setError('Please complete all required fields.')
      return
    }

    setStatus('sending')
    setError(null)

    const payload: FreeQuranRequestPayload = {
      productId: selected.id,
      productSlug: selected.slug,
      productTitle: selected.title,
      quantity: Math.min(maxQty, Math.max(1, quantity)),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      note: note.trim(),
    }

    try {
      await submitPublicForm({
        data: {
          formType: 'free_quran',
          name: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          message: payload.note || `Free request: ${payload.productTitle} × ${payload.quantity}`,
          payload,
        },
      })
      setStatus('sent')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Could not send your request.')
    }
  }

  if (!freeProducts.length) {
    return (
      <p className="rounded-2xl border border-dq-border bg-dq-cream/30 p-6 text-sm text-dq-muted">
        Free copies are temporarily unavailable. Please contact us and we will help you directly.
      </p>
    )
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-dq-gold/40 bg-dq-gold/10 p-6 text-center">
        <h2 className="type-title text-dq-black">Request received</h2>
        <p className="type-body mt-3 text-dq-muted">
          Thank you. We will review your free Qur&apos;an request and arrange delivery to the address you provided.
        </p>
      </div>
    )
  }

  return (
    <form className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Free copy" id="freeProduct">
          <FormSelect
            id="freeProduct"
            value={productId}
            onValueChange={setProductId}
            options={freeProducts.map((p) => ({ value: p.id, label: p.title }))}
            placeholder="Select a free copy"
          />
        </Field>
        <Field label="Quantity" id="freeQty">
          <input
            id="freeQty"
            className={formControlClass}
            type="number"
            min={1}
            max={maxQty}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" id="freeName">
          <input
            id="freeName"
            className={formControlClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </Field>
        <Field label="Email" id="freeEmail">
          <input
            id="freeEmail"
            type="email"
            className={formControlClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Phone" id="freePhone">
          <input
            id="freePhone"
            type="tel"
            className={formControlClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="space-y-4 rounded-2xl border border-dq-border bg-white p-5">
        <h3 className="type-title text-dq-black">Delivery address</h3>
        <Field label="Address line 1" id="freeLine1">
          <input
            id="freeLine1"
            className={formControlClass}
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
          />
        </Field>
        <Field label="Address line 2" id="freeLine2" required={false}>
          <input
            id="freeLine2"
            className={formControlClass}
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="City" id="freeCity">
            <input id="freeCity" className={formControlClass} value={city} onChange={(e) => setCity(e.target.value)} required />
          </Field>
          <Field label="State / county" id="freeState">
            <input id="freeState" className={formControlClass} value={state} onChange={(e) => setState(e.target.value)} required />
          </Field>
          <Field label="Postal code" id="freePostal">
            <input
              id="freePostal"
              className={formControlClass}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
            />
          </Field>
          <Field label="Country" id="freeCountry">
            <input
              id="freeCountry"
              className={formControlClass}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </Field>
        </div>
      </div>

      <Field label="Note (optional)" id="freeNote" required={false}>
        <textarea
          id="freeNote"
          className={formControlClass + ' min-h-24'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Preferred edition, language, or delivery notes"
        />
      </Field>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant="gold" size="lg" disabled={status === 'sending'}>
        {status === 'sending' ? 'Submitting…' : 'Submit free request'}
      </Button>
    </form>
  )
}
