import type { TrustBlock } from '#/lib/cms/types'
import type { PostageTier } from '#/lib/commerce/quoteUkQuranOrder'
import { QuranOrderForm } from '#/components/forms/QuranOrderForm'
import { SectionHeading } from '#/components/ui/section-heading'

const DEFAULT_IMAGE = '/images/quran-product.jpg'

type HomeQuranOrderSectionProps = {
  imageUrl?: string
  tiers: PostageTier[]
  postageNote?: TrustBlock
}

export function HomeQuranOrderSection({ imageUrl, tiers, postageNote }: HomeQuranOrderSectionProps) {
  const src = imageUrl?.trim() || DEFAULT_IMAGE

  return (
    <section className="grid min-h-[36rem] md:min-h-[40rem] md:grid-cols-2">
      <div className="relative h-56 overflow-hidden md:h-auto md:min-h-[40rem]">
        <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-col justify-center bg-white px-5 py-10 md:px-10 md:py-16 lg:px-12 xl:px-16">
        <SectionHeading title="Order a" highlight="Qur'an" className="mb-4" />
        <p className="type-body mb-8 max-w-xl text-dq-muted">
          The first copy is free — you pay UK postage. Extra copies include a contribution to print cost. Delivery is
          within the United Kingdom only.
        </p>
        <QuranOrderForm variant="steps" tiers={tiers} postageNote={postageNote} />
      </div>
    </section>
  )
}
