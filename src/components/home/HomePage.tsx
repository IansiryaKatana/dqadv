import type { CmsSnapshot, PromoTile } from '#/lib/cms/types'
import type { DonatePreset } from '#/lib/commerce/donateAmounts'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { HeroSection } from '#/components/sections/HeroSection'
import { WhatsInsideSection } from '#/components/sections/WhatsInsideSection'
import { GreatestVentureSection } from '#/components/sections/GreatestVentureSection'
import { GiveHomeSection } from '#/components/sections/GiveHomeSection'
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

export function HomePage({ data, presets }: { data: CmsSnapshot; presets: DonatePreset[] }) {
  const wikiGridTiles = quranWikiGridTiles(data.quranWikiArticles, data.quranWiki.linkUrl)

  return (
    <PublicLayout data={data}>
      <div className="relative isolate">
        <HeroSection hero={data.hero} className="sticky top-0 z-[1]" />
        <WhatsInsideSection content={data.whatsInside} className="sticky top-0 z-[2]" />
      </div>
      <GreatestVentureSection section={data.ventureSection} images={data.ventureImages} />
      <GiveHomeSection presets={presets} />
      <StoriesSection stories={data.stories} />
      <QuranWikiBanner banner={data.quranWiki} />
      <PromoTilesSection tiles={wikiGridTiles.length ? wikiGridTiles : data.promoTiles} />
    </PublicLayout>
  )
}
