import staticCms from '#/data/static-cms.json'
import staticTrust from '#/data/static-trust.json'
import { getSupabase } from '#/integrations/supabase/client'
import type { CmsSnapshot, DonationProduct, TrustBlock, TrustContent } from './types'

function indexTrustBlocks(blocks: TrustBlock[]): TrustContent {
  const byKey: Record<string, TrustBlock> = {}
  for (const block of blocks) byKey[block.key] = block
  return { blocks, byKey }
}

function staticTrustContent(): TrustContent {
  return indexTrustBlocks(staticTrust.blocks as TrustBlock[])
}

function mapDonationProduct(
  r: Record<string, unknown>,
  kind: 'product' | 'quick',
): DonationProduct {
  return {
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    description: r.description as string,
    imageUrl: r.image_url as string,
    price: r.price as number | null,
    currency: r.currency as string | null,
    category: r.category as string | null,
    stockStatus: r.stock_status as string | null,
    ctaLabel: (r.cta_label as string) ?? 'DONATE NOW',
    ctaUrl: (r.cta_url as string) ?? '/donate',
    kind,
    sortOrder: r.sort_order as number,
    requiresShipping: (r.requires_shipping as boolean) ?? false,
    impactStatement: (r.impact_statement as string) ?? null,
    minAmount: (r.min_amount as number) ?? null,
    maxQuantity: (r.max_quantity as number) ?? 99,
  }
}

function filterNavigation<T extends { href: string }>(links: T[]): T[] {
  return links.filter((l) => l.href !== '/order-free-qurans')
}

function staticSnapshot(): CmsSnapshot {
  return {
    mode: 'static',
    navigation: filterNavigation(staticCms.navigation),
    hero: staticCms.hero,
    whatsInside: staticCms.whatsInside,
    ventureSection: staticCms.ventureSection,
    ventureImages: staticCms.ventureImages,
    donationProducts: staticCms.donationProducts,
    quickDonations: staticCms.quickDonations,
    stories: staticCms.stories,
    blogPosts: staticCms.blogPosts,
    promoTiles: staticCms.promoTiles,
    quranWiki: staticCms.quranWiki,
    quranWikiArticles: staticCms.quranWikiArticles,
    footer: staticCms.footer,
    siteSettings: staticCms.siteSettings,
    trust: staticTrustContent(),
  }
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === '42P01' || /does not exist|relation.*not found/i.test(error.message ?? '')
}

export async function loadCmsSnapshot(): Promise<CmsSnapshot> {
  const sb = getSupabase()
  if (!sb) {
    if (import.meta.env.DEV) {
      console.warn('[CMS] Supabase env missing — using static-cms.json. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.')
    }
    return staticSnapshot()
  }

  try {
    const [
      navRes,
      heroRes,
      insideRes,
      ventureSectionRes,
      ventureImagesRes,
      productsRes,
      storiesRes,
      articlesRes,
      authorsRes,
      promoRes,
      wikiRes,
      wikiArticlesRes,
      footerRes,
      settingsRes,
      trustRes,
    ] = await Promise.all([
      sb.from('dq_navigation_links').select('*').eq('is_active', true).order('sort_order'),
      sb.from('dq_hero_content').select('*').eq('is_active', true).limit(1).maybeSingle(),
      sb.from('dq_whats_inside').select('*').eq('is_active', true).limit(1).maybeSingle(),
      sb.from('dq_venture_section').select('*').eq('is_active', true).limit(1).maybeSingle(),
      sb.from('dq_venture_images').select('*').eq('is_active', true).order('sort_order'),
      sb.from('dq_donation_products').select('*').eq('is_active', true).eq('published', true).order('sort_order'),
      sb.from('dq_story_posters').select('*').eq('is_active', true).eq('published', true).order('sort_order'),
      sb.from('dq_articles').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(4),
      sb.from('dq_authors').select('*'),
      sb.from('dq_promo_tiles').select('*').eq('is_active', true).eq('published', true).order('sort_order'),
      sb.from('dq_quran_wiki_banner').select('*').eq('is_active', true).limit(1).maybeSingle(),
      sb.from('dq_quran_wiki_articles').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(3),
      sb.from('dq_footer_settings').select('*').eq('is_active', true).limit(1).maybeSingle(),
      sb.from('dq_site_settings').select('*'),
      sb.from('dq_trust_blocks').select('*').eq('is_active', true).order('sort_order'),
    ])

    const responses = [navRes, heroRes, insideRes, ventureSectionRes, ventureImagesRes, productsRes, storiesRes, articlesRes, authorsRes, promoRes, wikiRes, wikiArticlesRes, footerRes, settingsRes, trustRes]
    const errors = responses.map((r) => r.error).filter(Boolean)

    if (import.meta.env.DEV && errors.length > 0) {
      console.warn('[CMS] Supabase query errors:', errors)
    }

    if (responses.some((r) => isMissingTableError(r.error))) return staticSnapshot()

    if (errors.length === responses.length) return staticSnapshot()

    const fallback = staticSnapshot()
    const authors = new Map((authorsRes.data ?? []).map((a) => [a.id, a]))

    const settings: Record<string, string> = { ...fallback.siteSettings }
    for (const row of settingsRes.data ?? []) settings[row.key] = row.value

    return {
      mode: 'live',
      navigation: (navRes.data ?? [])
        .filter((r) => r.is_active && r.href !== '/order-free-qurans')
        .map((r) => ({
          id: r.id,
          label: r.label,
          href: r.href,
          sortOrder: r.sort_order,
          showInHeader: r.show_in_header,
          showInFooter: r.show_in_footer,
          footerGroup: r.footer_group,
        })),
      hero: heroRes.data
        ? {
            id: heroRes.data.id,
            titleLine1: heroRes.data.title_line1,
            titleLine2: heroRes.data.title_line2,
            titleLine3: heroRes.data.title_line3,
            highlightWord: heroRes.data.highlight_word,
            description: heroRes.data.description,
            imageUrl: heroRes.data.image_url,
            imageUrlTablet: heroRes.data.image_url_tablet,
            imageUrlMobile: heroRes.data.image_url_mobile,
            primaryCtaLabel: heroRes.data.primary_cta_label,
            primaryCtaUrl: heroRes.data.primary_cta_url,
            secondaryCtaLabel: heroRes.data.secondary_cta_label,
            secondaryCtaUrl: heroRes.data.secondary_cta_url,
          }
        : fallback.hero,
      whatsInside: insideRes.data
        ? {
            id: insideRes.data.id,
            heading: insideRes.data.heading,
            highlightWord: insideRes.data.highlight_word,
            introHtml: insideRes.data.intro_html,
            bullets: Array.isArray(insideRes.data.bullets) ? (insideRes.data.bullets as string[]) : [],
            imageUrl: insideRes.data.image_url,
            backgroundColor: insideRes.data.background_color ?? null,
          }
        : fallback.whatsInside,
      ventureSection: ventureSectionRes.data
        ? {
            id: ventureSectionRes.data.id,
            heading: ventureSectionRes.data.heading,
            highlightWord: ventureSectionRes.data.highlight_word,
            subtitle: ventureSectionRes.data.subtitle,
            description: ventureSectionRes.data.description,
          }
        : fallback.ventureSection,
      ventureImages: (ventureImagesRes.data ?? []).map((r) => ({
        id: r.id,
        imageUrl: r.image_url,
        alt: r.alt,
        caption: r.caption,
        sortOrder: r.sort_order,
      })),
      donationProducts: (productsRes.data ?? [])
        .filter((r) => r.kind === 'product')
        .map((r) => mapDonationProduct(r, 'product')),
      quickDonations: (productsRes.data ?? [])
        .filter((r) => r.kind === 'quick')
        .map((r) => mapDonationProduct(r, 'quick')),
      stories: (storiesRes.data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        imageUrl: r.image_url,
        videoUrl: r.video_url,
        linkUrl: r.link_url,
        sortOrder: r.sort_order,
      })),
      blogPosts: (articlesRes.data ?? []).map((r) => {
        const author = r.author_id ? authors.get(r.author_id) : null
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt,
          coverImageUrl: r.cover_image_url,
          category: r.category,
          authorName: author?.name ?? 'Donate Quran Team',
          authorAvatar: author?.avatar_url,
          publishedAt: r.published_at ?? r.created_at ?? new Date().toISOString(),
          readTime: r.read_time,
        }
      }),
      promoTiles: (promoRes.data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        imageUrl: r.image_url,
        linkUrl: r.link_url,
        sortOrder: r.sort_order,
      })),
      quranWiki: wikiRes.data
        ? {
            id: wikiRes.data.id,
            title: wikiRes.data.title,
            subtitle: wikiRes.data.subtitle,
            imageUrl: wikiRes.data.image_url,
            linkUrl: wikiRes.data.link_url,
          }
        : fallback.quranWiki,
      quranWikiArticles: (wikiArticlesRes.data ?? []).map((r) => {
        const author = r.author_id ? authors.get(r.author_id) : null
        return {
          id: r.id,
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt,
          coverImageUrl: r.cover_image_url,
          category: r.category,
          authorName: author?.name ?? 'Donate Quran Team',
          authorAvatar: author?.avatar_url,
          publishedAt: r.published_at ?? r.created_at ?? new Date().toISOString(),
          readTime: r.read_time,
        }
      }),
      footer: footerRes.data
        ? {
            id: footerRes.data.id,
            aboutText: footerRes.data.about_text,
            email: footerRes.data.email,
            phone: footerRes.data.phone,
            address: footerRes.data.address,
            copyright: footerRes.data.copyright,
            developerCredit: footerRes.data.developer_credit,
            socialLinks: Array.isArray(footerRes.data.social_links)
              ? (footerRes.data.social_links as { label: string; href: string }[])
              : [],
          }
        : fallback.footer,
      siteSettings: settings,
      trust: trustRes.data?.length
        ? indexTrustBlocks(
            trustRes.data.map((r) => ({
              id: r.id,
              key: r.key,
              title: r.title,
              bodyHtml: r.body_html,
              extra: (r.extra as Record<string, unknown>) ?? {},
              sortOrder: r.sort_order,
            })),
          )
        : fallback.trust,
    }
  } catch {
    return staticSnapshot()
  }
}
