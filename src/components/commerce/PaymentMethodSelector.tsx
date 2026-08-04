import { cn } from '#/lib/utils'

export type PaymentMethod = 'stripe' | 'paypal'

type PaymentMethodSelectorProps = {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  stripeEnabled: boolean
  paypalEnabled: boolean
}

export function PaymentMethodSelector({
  value,
  onChange,
  stripeEnabled,
  paypalEnabled,
}: PaymentMethodSelectorProps) {
  const options: { id: PaymentMethod; label: string; description: string; enabled: boolean }[] = [
    {
      id: 'stripe',
      label: 'Card payment',
      description: 'Pay securely with credit or debit card.',
      enabled: stripeEnabled,
    },
    {
      id: 'paypal',
      label: 'PayPal',
      description: 'Pay with PayPal or as a guest with a debit/credit card (no PayPal account required when enabled).',
      enabled: paypalEnabled,
    },
  ]

  const available = options.filter((o) => o.enabled)
  if (available.length <= 1) return null

  return (
    <div className="rounded-2xl border border-dq-border bg-white p-6">
      <h2 className="type-title mb-4 text-dq-black">Payment method</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {available.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-xl border-2 p-4 text-left transition-colors',
              value === option.id
                ? 'border-dq-gold bg-dq-cream/40'
                : 'border-dq-border hover:border-dq-gold/50',
            )}
          >
            <span className="text-sm font-medium text-dq-black">{option.label}</span>
            <p className="mt-1 text-xs text-dq-muted">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
