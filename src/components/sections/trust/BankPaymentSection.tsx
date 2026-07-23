import type { TrustBlock } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { SectionHeading } from '#/components/ui/section-heading'

type BankPaymentSectionProps = {
  block: TrustBlock
}

export function BankPaymentSection({ block }: BankPaymentSectionProps) {
  const extra = block.extra ?? {}
  const bankName = String(extra.bankName ?? '')
  const bankAddress = String(extra.bankAddress ?? '')
  const accountNumber = String(extra.accountNumber ?? '')
  const iban = String(extra.iban ?? '')
  const swift = String(extra.swift ?? '')
  const referenceNote = String(extra.referenceNote ?? '')
  const orderNote = String(extra.orderNote ?? '')

  return (
    <section className="bg-dq-cream/50 py-16 md:py-24">
      <Container>
        <SectionHeading title={block.title} className="mb-8 max-w-2xl" />
        <div
          className="prose-dq mb-8 max-w-2xl [&_p]:type-body [&_p]:text-dq-muted"
          dangerouslySetInnerHTML={{ __html: block.bodyHtml }}
        />
        <div className="grid max-w-3xl grid-cols-1 gap-4 rounded-2xl border-2 border-dq-gold/50 bg-white p-6 md:grid-cols-2 md:p-8">
          <div>
            <p className="type-label text-dq-muted">Bank name</p>
            <p className="type-body text-dq-black">{bankName}</p>
          </div>
          <div>
            <p className="type-label text-dq-muted">Account number</p>
            <p className="type-body text-dq-black">{accountNumber}</p>
          </div>
          <div className="md:col-span-2">
            <p className="type-label text-dq-muted">Bank address</p>
            <p className="type-body text-dq-black">{bankAddress}</p>
          </div>
          <div>
            <p className="type-label text-dq-muted">IBAN</p>
            <p className="type-body break-all text-dq-black">{iban}</p>
          </div>
          <div>
            <p className="type-label text-dq-muted">SWIFT</p>
            <p className="type-body text-dq-black">{swift}</p>
          </div>
          {referenceNote ? (
            <p className="type-body text-sm text-dq-muted md:col-span-2">*{referenceNote}</p>
          ) : null}
          {orderNote ? <p className="type-body text-sm text-dq-muted md:col-span-2">*{orderNote}</p> : null}
        </div>
      </Container>
    </section>
  )
}
