import { useState, type ReactNode } from 'react'
import type { DistributorFormPayload } from '#/lib/cms/types'
import { submitPublicForm } from '#/lib/forms/submitPublicForm'
import { Button } from '#/components/ui/button'
import { formControlClass } from '#/components/ui/form-controls'
import { FormSelect } from '#/components/ui/select'
import { CountrySelect } from '#/components/forms/CountrySelect'
import { cn } from '#/lib/utils'

const STEPS = ['You', 'Location', 'Channel', 'About you'] as const

const TITLE_OPTIONS = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Dr', label: 'Dr' },
]

const emptyForm = (): DistributorFormPayload => ({
  title: '',
  firstName: '',
  lastName: '',
  companyName: '',
  email: '',
  website: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  country: '',
  stateProvince: '',
  zipPostalCode: '',
  primaryPhone: '',
  secondaryPhone: '',
  hearAboutUs: '',
  contactReason: '',
  channelDescription: '',
  distributingCountry: '',
  distributingArea: '',
  storageLocation: '',
  distributeTo: '',
  raisingFunds: '',
  approximateQuantity: '',
  whyDistribute: '',
  yearsInBusiness: '',
  companyDescription: '',
})

function Field({
  label,
  id,
  required = true,
  children,
}: {
  label: string
  id: string
  required?: boolean
  children: ReactNode
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

export function DistributeForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<DistributorFormPayload>(emptyForm)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof DistributorFormPayload>(key: K, value: DistributorFormPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validateStep(): boolean {
    if (step === 0) {
      return Boolean(
        form.title &&
          form.firstName &&
          form.lastName &&
          form.companyName &&
          form.email &&
          form.website,
      )
    }
    if (step === 1) {
      return Boolean(
        form.addressLine1 &&
          form.city &&
          form.country &&
          form.stateProvince &&
          form.zipPostalCode &&
          form.primaryPhone &&
          form.secondaryPhone,
      )
    }
    if (step === 2) {
      return Boolean(
        form.hearAboutUs &&
          form.contactReason &&
          form.channelDescription &&
          form.distributingCountry &&
          form.distributingArea &&
          form.storageLocation &&
          form.distributeTo &&
          form.raisingFunds &&
          form.approximateQuantity,
      )
    }
    return Boolean(form.whyDistribute && form.yearsInBusiness && form.companyDescription)
  }

  async function submit() {
    if (!validateStep()) {
      setError('Please complete all required fields.')
      return
    }
    setStatus('sending')
    setError(null)

    const fullName = `${form.title} ${form.firstName} ${form.lastName}`.trim()

    try {
      await submitPublicForm({
        data: {
          formType: 'distributor',
          name: fullName,
          email: form.email,
          phone: form.primaryPhone,
          message: form.contactReason,
          payload: form,
        },
      })
      setStatus('sent')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Could not send your application.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-dq-gold/50 bg-dq-cream/30 p-8 text-center">
        <h2 className="type-title text-dq-black">Application received</h2>
        <p className="type-body mt-3 text-dq-muted">
          Thank you for your interest in becoming a distributor. Our team will review your application and be in touch
          soon.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dq-border bg-white p-5 md:p-8">
      <div className="mb-8 flex gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-1">
            <div
              className={cn(
                'h-1 rounded-full',
                i <= step ? 'bg-dq-gold' : 'bg-dq-border',
              )}
            />
            <span className={cn('type-label text-[10px]', i === step ? 'text-dq-black' : 'text-dq-muted')}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Title" id="title">
            <FormSelect
              id="title"
              value={form.title}
              onValueChange={(value) => update('title', value)}
              options={TITLE_OPTIONS}
              placeholder="Select title"
            />
          </Field>
          <div className="hidden md:block" />
          <Field label="First name" id="firstName">
            <input
              id="firstName"
              required
              placeholder="First name"
              className={formControlClass}
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
            />
          </Field>
          <Field label="Last name" id="lastName">
            <input
              id="lastName"
              required
              placeholder="Last name"
              className={formControlClass}
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
            />
          </Field>
          <Field label="Company name" id="companyName">
            <input
              id="companyName"
              required
              placeholder="Organisation or company name"
              className={formControlClass}
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
          </Field>
          <Field label="Your email" id="email">
            <input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              className={formControlClass}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </Field>
          <Field label="Your website" id="website">
            <input
              id="website"
              type="url"
              required
              placeholder="https://yourwebsite.com"
              className={formControlClass}
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Address line 1" id="addressLine1">
            <input
              id="addressLine1"
              required
              placeholder="Street address"
              className={formControlClass}
              value={form.addressLine1}
              onChange={(e) => update('addressLine1', e.target.value)}
            />
          </Field>
          <Field label="Address line 2" id="addressLine2">
            <input
              id="addressLine2"
              required
              placeholder="Suite, unit, or building"
              className={formControlClass}
              value={form.addressLine2}
              onChange={(e) => update('addressLine2', e.target.value)}
            />
          </Field>
          <Field label="City" id="city">
            <input
              id="city"
              required
              placeholder="City"
              className={formControlClass}
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
            />
          </Field>
          <Field label="Country" id="country">
            <CountrySelect
              id="country"
              required
              placeholder="Select country"
              value={form.country}
              onValueChange={(value) => update('country', value)}
            />
          </Field>
          <Field label="State / Province" id="stateProvince">
            <input
              id="stateProvince"
              required
              placeholder="State or province"
              className={formControlClass}
              value={form.stateProvince}
              onChange={(e) => update('stateProvince', e.target.value)}
            />
          </Field>
          <Field label="Zip / Postal code" id="zipPostalCode">
            <input
              id="zipPostalCode"
              required
              placeholder="Postal code"
              className={formControlClass}
              value={form.zipPostalCode}
              onChange={(e) => update('zipPostalCode', e.target.value)}
            />
          </Field>
          <Field label="Primary contact number" id="primaryPhone">
            <input
              id="primaryPhone"
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              className={formControlClass}
              value={form.primaryPhone}
              onChange={(e) => update('primaryPhone', e.target.value)}
            />
          </Field>
          <Field label="Secondary contact number" id="secondaryPhone">
            <input
              id="secondaryPhone"
              type="tel"
              required
              placeholder="+1 (555) 000-0000"
              className={formControlClass}
              value={form.secondaryPhone}
              onChange={(e) => update('secondaryPhone', e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid grid-cols-1 gap-5">
          <Field label="How did you hear about us?" id="hearAboutUs">
            <input
              id="hearAboutUs"
              required
              placeholder="e.g. Social media, referral, event"
              className={formControlClass}
              value={form.hearAboutUs}
              onChange={(e) => update('hearAboutUs', e.target.value)}
            />
          </Field>
          <Field label="What made you contact us today?" id="contactReason">
            <textarea
              id="contactReason"
              required
              rows={3}
              placeholder="Tell us what prompted your application"
              className={cn(formControlClass, 'resize-none')}
              value={form.contactReason}
              onChange={(e) => update('contactReason', e.target.value)}
            />
          </Field>
          <Field label="How would you best describe the channel where you operate?" id="channelDescription">
            <textarea
              id="channelDescription"
              required
              rows={3}
              placeholder="e.g. Mosque, community centre, charity network"
              className={cn(formControlClass, 'resize-none')}
              value={form.channelDescription}
              onChange={(e) => update('channelDescription', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Which country will you be distributing in?" id="distributingCountry">
              <CountrySelect
                id="distributingCountry"
                required
                placeholder="Select country"
                value={form.distributingCountry}
                onValueChange={(value) => update('distributingCountry', value)}
              />
            </Field>
            <Field label="Which area of the country?" id="distributingArea">
              <input
                id="distributingArea"
                required
                placeholder="Region, city, or area"
                className={formControlClass}
                value={form.distributingArea}
                onChange={(e) => update('distributingArea', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Where will the Qurans be stored?" id="storageLocation">
            <input
              id="storageLocation"
              required
              placeholder="Warehouse, office, or storage address"
              className={formControlClass}
              value={form.storageLocation}
              onChange={(e) => update('storageLocation', e.target.value)}
            />
          </Field>
          <Field label="Who are you going to be distributing to?" id="distributeTo">
            <textarea
              id="distributeTo"
              required
              rows={3}
              placeholder="Mosques, schools, hospitals, homes, etc."
              className={cn(formControlClass, 'resize-none')}
              value={form.distributeTo}
              onChange={(e) => update('distributeTo', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Are you going to be raising funds for Donate Quran?" id="raisingFunds">
              <input
                id="raisingFunds"
                required
                placeholder="Yes or no — with brief details"
                className={formControlClass}
                value={form.raisingFunds}
                onChange={(e) => update('raisingFunds', e.target.value)}
              />
            </Field>
            <Field label="Approximate quantity to distribute?" id="approximateQuantity">
              <input
                id="approximateQuantity"
                required
                placeholder="e.g. 500 copies per year"
                className={formControlClass}
                value={form.approximateQuantity}
                onChange={(e) => update('approximateQuantity', e.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid grid-cols-1 gap-5">
          <Field label="Why do you want to distribute the Quran?" id="whyDistribute">
            <textarea
              id="whyDistribute"
              required
              rows={4}
              placeholder="Share your motivation and goals"
              className={cn(formControlClass, 'resize-none')}
              value={form.whyDistribute}
              onChange={(e) => update('whyDistribute', e.target.value)}
            />
          </Field>
          <Field label="How long has your company been in business?" id="yearsInBusiness">
            <input
              id="yearsInBusiness"
              required
              placeholder="e.g. 5 years"
              className={formControlClass}
              value={form.yearsInBusiness}
              onChange={(e) => update('yearsInBusiness', e.target.value)}
            />
          </Field>
          <Field label="Briefly describe yourself and your company" id="companyDescription">
            <textarea
              id="companyDescription"
              required
              rows={5}
              placeholder="A short overview of your organisation and experience"
              className={cn(formControlClass, 'resize-none')}
              value={form.companyDescription}
              onChange={(e) => update('companyDescription', e.target.value)}
            />
          </Field>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0 || status === 'sending'}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            variant="gold"
            onClick={() => {
              if (!validateStep()) {
                setError('Please complete all required fields.')
                return
              }
              setError(null)
              setStep((s) => s + 1)
            }}
          >
            Continue
          </Button>
        ) : (
          <Button type="button" variant="gold" disabled={status === 'sending'} onClick={() => void submit()}>
            {status === 'sending' ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          </Button>
        )}
      </div>
    </div>
  )
}
