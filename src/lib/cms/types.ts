export type NavLink = {
  id: string
  label: string
  href: string
  sortOrder: number
  showInHeader: boolean
  showInFooter: boolean
  footerGroup?: string | null
}

export type HeroContent = {
  id: string
  titleLine1: string
  titleLine2: string
  titleLine3: string
  highlightWord: string
  description: string
  imageUrl: string
  imageUrlTablet?: string | null
  imageUrlMobile?: string | null
  primaryCtaLabel: string
  primaryCtaUrl: string
  secondaryCtaLabel: string
  secondaryCtaUrl: string
}

export type WhatsInsideContent = {
  id: string
  heading: string
  highlightWord: string
  introHtml: string
  bullets: string[]
  imageUrl: string
  backgroundColor?: string | null
}

export type VentureSection = {
  id: string
  heading: string
  highlightWord: string
  subtitle: string
  description: string
}

export type VentureImage = {
  id: string
  imageUrl: string
  alt: string
  caption?: string | null
  sortOrder: number
}

export type DonationProduct = {
  id: string
  slug: string
  title: string
  description: string
  imageUrl: string
  price?: number | null
  currency?: string | null
  category?: string | null
  stockStatus?: string | null
  ctaLabel: string
  ctaUrl: string
  kind: 'product' | 'quick'
  sortOrder: number
  requiresShipping?: boolean
  impactStatement?: string | null
  minAmount?: number | null
  maxQuantity?: number
}

export type BlogPostDetail = BlogPost & {
  bodyHtml: string
}

export type StoryPoster = {
  id: string
  title: string
  imageUrl: string
  videoUrl?: string | null
  linkUrl?: string | null
  sortOrder: number
}

export type Author = {
  id: string
  name: string
  avatarUrl?: string | null
}

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImageUrl: string
  category: string
  authorName: string
  authorAvatar?: string | null
  publishedAt: string
  readTime?: string | null
}

export type PromoTile = {
  id: string
  title: string
  imageUrl: string
  linkUrl: string
  sortOrder: number
}

export type QuranWikiBanner = {
  id: string
  title: string
  subtitle: string
  imageUrl: string
  linkUrl: string
}

export type QuranWikiArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImageUrl: string
  category: string
  authorName: string
  authorAvatar?: string | null
  publishedAt: string
  readTime?: string | null
}

export type FooterSettings = {
  id: string
  aboutText: string
  email: string
  phone: string
  address: string
  copyright: string
  developerCredit?: string | null
  socialLinks: { label: string; href: string }[]
}

export type SiteSettings = Record<string, string>

export type TrustBlock = {
  id: string
  key: string
  title: string
  bodyHtml: string
  extra?: Record<string, unknown> | null
  sortOrder: number
}

export type TrustContent = {
  blocks: TrustBlock[]
  byKey: Record<string, TrustBlock>
}

export type QuranEdition = {
  id: string
  slug: string
  language: string
  featuredImageUrl: string
  pdfUrl?: string | null
  sortOrder: number
}

export type Book = {
  id: string
  slug: string
  title: string
  excerpt: string
  coverImageUrl: string
  /** Optional 16:9 image for listing cards; falls back to coverImageUrl when empty. */
  cardCoverImageUrl?: string | null
  category: string
  authorName: string
  authorAvatar?: string | null
  publishedAt: string
  readTime?: string | null
  sortOrder: number
  viewCount?: number
}

export type BookDetail = Book & {
  bodyHtml: string
}

export type FeaturedVideo = {
  id: string
  slug: string
  title: string
  description: string
  thumbnailUrl: string
  videoType: 'upload' | 'youtube'
  videoUrl: string
  duration?: string | null
  sortOrder: number
}

export type DistributorFormPayload = {
  title: string
  firstName: string
  lastName: string
  companyName: string
  email: string
  website: string
  addressLine1: string
  addressLine2: string
  city: string
  country: string
  stateProvince: string
  zipPostalCode: string
  primaryPhone: string
  secondaryPhone: string
  hearAboutUs: string
  contactReason: string
  channelDescription: string
  distributingCountry: string
  distributingArea: string
  storageLocation: string
  distributeTo: string
  raisingFunds: string
  approximateQuantity: string
  whyDistribute: string
  yearsInBusiness: string
  companyDescription: string
}

export type CmsSnapshot = {
  mode: 'live' | 'static'
  navigation: NavLink[]
  hero: HeroContent
  whatsInside: WhatsInsideContent
  ventureSection: VentureSection
  ventureImages: VentureImage[]
  donationProducts: DonationProduct[]
  quickDonations: DonationProduct[]
  stories: StoryPoster[]
  blogPosts: BlogPost[]
  promoTiles: PromoTile[]
  quranWiki: QuranWikiBanner
  quranWikiArticles: QuranWikiArticle[]
  footer: FooterSettings
  siteSettings: SiteSettings
  trust: TrustContent
}
