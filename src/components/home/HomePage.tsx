import type { CmsSnapshot, PromoTile, TrustBlock } from '#/lib/cms/types'
import type { DonatePreset } from '#/lib/commerce/donateAmounts'
import type { PostageTier } from '#/lib/commerce/quoteUkQuranOrder'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { HeroSection } from '#/components/sections/HeroSection'
import { WhatsInsideSection } from '#/components/sections/WhatsInsideSection'
import { GreatestVentureSection } from '#/components/sections/GreatestVentureSection'
import { GiveHomeSection } from '#/components/sections/GiveHomeSection'
import { HomeQuranOrderSection } from '#/components/sections/HomeQuranOrderSection'
import { StoriesSection } from '#/components/sections/StoriesSection'
import { QuranWikiBanner } from '#/components/sections/QuranWikiBanner'
import { PromoTilesSection } from '#/components/sections/PromoTilesSection'

function quranWikiGridTiles(articles: CmsSnapshot['quranWikiArticles'], linkUrl: string): PromoTile[] {
  return articles.slice(0, 3).map((article, index) => ({
    id: article.id,
    title: article.title,
    imageUrl: article.coverImageUrl,
    linkUrl,
    sortOrder: index + 1,
  }))
}

export function HomePage({
  data,
  presets,
  postageTiers,
}: {
  data: CmsSnapshot
  presets: DonatePreset[]
  postageTiers: PostageTier[]
}) {
  const wikiGridTiles = quranWikiGridTiles(data.quranWikiArticles, data.quranWiki.linkUrl)
  const postageNote: TrustBlock | undefined = data.trust.byKey.postage_packaging

  return (
    <PublicLayout data={data}>
      <div className="relative isolate">
        <HeroSection hero={data.hero} className="sticky top-0 z-[1]" />
        <WhatsInsideSection content={data.whatsInside} className="sticky top-0 z-[2]" />
      </div>
      <GreatestVentureSection section={data.ventureSection} images={data.ventureImages} />
      <GiveHomeSection presets={presets} />
      <HomeQuranOrderSection
        imageUrl={data.siteSettings.home_quran_order_image_url}
        tiers={postageTiers}
        postageNote={postageNote}
      />
      <StoriesSection stories={data.stories} />
      <QuranWikiBanner banner={data.quranWiki} />
      <PromoTilesSection tiles={wikiGridTiles.length ? wikiGridTiles : data.promoTiles} />
    </PublicLayout>
  )
}
