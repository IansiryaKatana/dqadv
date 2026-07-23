import type { TrustContent } from '#/lib/cms/types'
import { TrustHtmlSection } from './TrustHtmlSection'

export function WhyDonateSection({ trust }: { trust: TrustContent }) {
  const intro = trust.byKey.sadaqah_intro
  const why = trust.byKey.why_donate
  const ongoing = trust.byKey.ongoing_charity

  if (!intro && !why && !ongoing) return null

  return (
    <>
      {intro ? <TrustHtmlSection block={intro} variant="dark" /> : null}
      {why ? <TrustHtmlSection block={why} variant="cream" /> : null}
      {ongoing ? <TrustHtmlSection block={ongoing} variant="light" /> : null}
    </>
  )
}
