import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Database } from '#/integrations/supabase/database.types'
import { getSupabase } from '#/integrations/supabase/client'
import {
  DEFAULT_BRAND_COLORS,
  DEFAULT_FAVICON,
  DEFAULT_FONT_FAMILY,
  DEFAULT_LOGO_DARK,
  DEFAULT_LOGO_LIGHT,
  ON_GOLD_PRESETS,
  cssFontFamilyStack,
  hasReadableContrast,
  publishBrandSettings,
  resolveBrandTheme,
  resolveHexColor,
} from '#/lib/site/branding'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { ImageUploadField } from './components/ImageUploadField'
import { MediaUploadField } from './components/MediaUploadField'
import { AdminColorField } from './components/AdminColorField'
import { AdminPaymentsSettings } from './AdminPaymentsSettings'
import type { SettingsSiteTab } from './settingsTabs'

type NavRow = Database['public']['Tables']['dq_navigation_links']['Row']
type FooterRow = Database['public']['Tables']['dq_footer_settings']['Row']

type SocialLink = { label: string; href: string }

function parseSocialLinks(links: unknown): SocialLink[] {
  if (!Array.isArray(links)) return []
  return links.filter(
    (item): item is SocialLink =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as SocialLink).label === 'string' &&
      typeof (item as SocialLink).href === 'string',
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#737373]">{children}</label>
}

export function AdminSite({ tab }: { tab: SettingsSiteTab }) {
  const { refetch } = useCms()
  const [nav, setNav] = useState<NavRow[]>([])
  const [footer, setFooter] = useState<FooterRow | null>(null)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [appStoreUrl, setAppStoreUrl] = useState('')
  const [playStoreUrl, setPlayStoreUrl] = useState('')
  const [logoLightUrl, setLogoLightUrl] = useState('')
  const [logoDarkUrl, setLogoDarkUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_BRAND_COLORS.gold)
  const [onGold, setOnGold] = useState<string>(DEFAULT_BRAND_COLORS.onGold)
  const [colorBlack, setColorBlack] = useState<string>(DEFAULT_BRAND_COLORS.black)
  const [colorSoftBlack, setColorSoftBlack] = useState<string>(DEFAULT_BRAND_COLORS.softBlack)
  const [colorCream, setColorCream] = useState<string>(DEFAULT_BRAND_COLORS.cream)
  const [colorMuted, setColorMuted] = useState<string>(DEFAULT_BRAND_COLORS.muted)
  const [colorBorder, setColorBorder] = useState<string>(DEFAULT_BRAND_COLORS.border)
  const [fontFamily, setFontFamily] = useState<string>(DEFAULT_FONT_FAMILY)
  const [fontFileUrl, setFontFileUrl] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const loadId = useRef(0)

  const refresh = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    const id = ++loadId.current
    const [navRes, footerRes, settingsRes] = await Promise.all([
      sb.from('dq_navigation_links').select('*').order('sort_order'),
      sb.from('dq_footer_settings').select('*').limit(1).maybeSingle(),
      sb.from('dq_site_settings').select('*'),
    ])
    if (id !== loadId.current) return
    if (navRes.error) setErr(navRes.error.message)
    setNav(navRes.data ?? [])
    if (footerRes.data) {
      setFooter(footerRes.data)
      setSocialLinks(parseSocialLinks(footerRes.data.social_links))
    }
    const settings = Object.fromEntries((settingsRes.data ?? []).map((row) => [row.key, row.value]))
    setAppStoreUrl(settings.app_store_url ?? '')
    setPlayStoreUrl(settings.play_store_url ?? '')
    setLogoLightUrl(settings.logo_light_url ?? '')
    setLogoDarkUrl(settings.logo_dark_url ?? '')
    setFaviconUrl(settings.favicon_url ?? '')
    const theme = resolveBrandTheme(settings)
    setPrimaryColor(theme.gold)
    setOnGold(theme.onGold)
    setColorBlack(theme.black)
    setColorSoftBlack(theme.softBlack)
    setColorCream(theme.cream)
    setColorMuted(theme.muted)
    setColorBorder(theme.border)
    setFontFamily(theme.fontFamily)
    setFontFileUrl(theme.fontFileUrl)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveAll = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    setSaving(true)
    setErr(null)
    loadId.current += 1

    const savedSettings = {
      app_store_url: appStoreUrl.trim(),
      play_store_url: playStoreUrl.trim(),
      logo_light_url: logoLightUrl.trim(),
      logo_dark_url: logoDarkUrl.trim(),
      favicon_url: faviconUrl.trim(),
      primary_color: resolveHexColor(primaryColor, DEFAULT_BRAND_COLORS.gold),
      primary_foreground: resolveHexColor(onGold, DEFAULT_BRAND_COLORS.onGold),
      color_black: resolveHexColor(colorBlack, DEFAULT_BRAND_COLORS.black),
      color_soft_black: resolveHexColor(colorSoftBlack, DEFAULT_BRAND_COLORS.softBlack),
      color_cream: resolveHexColor(colorCream, DEFAULT_BRAND_COLORS.cream),
      color_muted: resolveHexColor(colorMuted, DEFAULT_BRAND_COLORS.muted),
      color_border: resolveHexColor(colorBorder, DEFAULT_BRAND_COLORS.border),
      font_family: fontFamily.trim() || DEFAULT_FONT_FAMILY,
      font_file_url: fontFileUrl.trim(),
    }

    const settingsRes = await sb.from('dq_site_settings').upsert(
      Object.entries(savedSettings).map(([key, value]) => ({ key, value })),
      { onConflict: 'key' },
    )

    const footerRes = footer
      ? await sb.from('dq_footer_settings').upsert({
          ...footer,
          social_links: socialLinks,
        })
      : { error: null }

    setSaving(false)
    if (footerRes.error || settingsRes.error) {
      setErr(footerRes.error?.message ?? settingsRes.error?.message ?? 'Save failed.')
      return
    }
    await refetch()
    publishBrandSettings(savedSettings)
  }, [
    footer,
    socialLinks,
    appStoreUrl,
    playStoreUrl,
    logoLightUrl,
    logoDarkUrl,
    faviconUrl,
    primaryColor,
    onGold,
    colorBlack,
    colorSoftBlack,
    colorCream,
    colorMuted,
    colorBorder,
    fontFamily,
    fontFileUrl,
    refetch,
  ])

  const headerActions = useMemo(
    () =>
      [{ label: saving ? 'Saving…' : 'Save settings', onClick: () => void saveAll() }],
    [saveAll, saving],
  )

  useAdminPageHeader({
    title: 'Settings',
    description: 'Branding (logos, colors, font), payments, email, footer contact, social links, and app download URLs.',
    actions: headerActions,
  })

  function updateSocialLink(index: number, patch: Partial<SocialLink>) {
    setSocialLinks((links) => links.map((link, i) => (i === index ? { ...link, ...patch } : link)))
  }

  function addSocialLink() {
    setSocialLinks((links) => [...links, { label: 'New link', href: 'https://' }])
  }

  function removeSocialLink(index: number) {
    setSocialLinks((links) => links.filter((_, i) => i !== index))
  }

  function FooterMissingMessage() {
    return (
      <p className="admin-muted rounded-xl border border-dashed border-[#d4d4d4] p-4 text-sm">
        Footer settings not found. Run CMS migrations and seed data to edit this section.
      </p>
    )
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}

          {tab === 'branding' ? (
            <>
              <p className="admin-muted text-sm">
                Upload logos, set brand colors and font, plus a favicon. Leave logo fields empty to use the built-in defaults.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <ImageUploadField
                  label="Logo (light background / header)"
                  value={logoLightUrl}
                  onChange={setLogoLightUrl}
                  folder="branding/logos"
                />
                <ImageUploadField
                  label="Logo (dark background / footer)"
                  value={logoDarkUrl}
                  onChange={setLogoDarkUrl}
                  folder="branding/logos"
                />
                <ImageUploadField
                  label="Favicon"
                  value={faviconUrl}
                  onChange={setFaviconUrl}
                  folder="branding/favicon"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp"
                />
              </div>
              <p className="admin-muted text-xs">
                Defaults: {DEFAULT_LOGO_LIGHT}, {DEFAULT_LOGO_DARK}, {DEFAULT_FAVICON}
              </p>

              <div className="border-t border-[#e5e5e5] pt-4">
                <h2 className="text-sm font-semibold text-dq-black">Brand colors</h2>
                <p className="admin-muted mt-1 text-sm">
                  These drive the live site tokens (gold buttons, cream surfaces, borders) and admin chrome.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AdminColorField
                    label="Gold / primary"
                    value={primaryColor}
                    fallback={DEFAULT_BRAND_COLORS.gold}
                    onChange={setPrimaryColor}
                  />
                  <div className="space-y-2">
                    <AdminColorField
                      label="Text on gold (CTA)"
                      value={onGold}
                      fallback={DEFAULT_BRAND_COLORS.onGold}
                      onChange={setOnGold}
                    />
                    <p className="admin-muted text-xs">Used on Donate / gold buttons, badges, and play icons.</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => setOnGold(ON_GOLD_PRESETS.black)}
                      >
                        Black
                      </button>
                      <button
                        type="button"
                        className="admin-btn-secondary"
                        onClick={() => setOnGold(ON_GOLD_PRESETS.white)}
                      >
                        White
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#e5e5e5] bg-white p-4 sm:col-span-2 lg:col-span-1">
                    <p className="admin-muted mb-3 text-xs uppercase tracking-wide">CTA preview</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className="type-label inline-flex h-11 items-center rounded-full px-6"
                        style={{ backgroundColor: primaryColor, color: onGold }}
                      >
                        Donate now
                      </span>
                      <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums"
                        style={{ backgroundColor: primaryColor, color: onGold }}
                      >
                        3
                      </span>
                    </div>
                    {!hasReadableContrast(primaryColor, onGold) ? (
                      <p className="mt-3 text-xs text-amber-700">
                        Low contrast — consider white or a lighter text color so the CTA stays readable.
                      </p>
                    ) : null}
                  </div>
                  <AdminColorField
                    label="Black"
                    value={colorBlack}
                    fallback={DEFAULT_BRAND_COLORS.black}
                    onChange={setColorBlack}
                  />
                  <AdminColorField
                    label="Soft black"
                    value={colorSoftBlack}
                    fallback={DEFAULT_BRAND_COLORS.softBlack}
                    onChange={setColorSoftBlack}
                  />
                  <AdminColorField
                    label="Cream"
                    value={colorCream}
                    fallback={DEFAULT_BRAND_COLORS.cream}
                    onChange={setColorCream}
                  />
                  <AdminColorField
                    label="Muted"
                    value={colorMuted}
                    fallback={DEFAULT_BRAND_COLORS.muted}
                    onChange={setColorMuted}
                  />
                  <AdminColorField
                    label="Border"
                    value={colorBorder}
                    fallback={DEFAULT_BRAND_COLORS.border}
                    onChange={setColorBorder}
                  />
                </div>
              </div>

              <div className="border-t border-[#e5e5e5] pt-4">
                <h2 className="text-sm font-semibold text-dq-black">Brand font</h2>
                <p className="admin-muted mt-1 text-sm">
                  Enter a Google Font family, or upload a custom file to override Google Fonts.
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <FieldLabel>Font family</FieldLabel>
                    <input
                      className="admin-input"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      placeholder={DEFAULT_FONT_FAMILY}
                    />
                  </div>
                  <MediaUploadField
                    label="Custom font file (optional)"
                    value={fontFileUrl}
                    onChange={setFontFileUrl}
                    folder="branding/fonts"
                    accept="font/woff2,font/woff,font/ttf,font/otf,.woff2,.woff,.ttf,.otf"
                    hint="Leave empty to load the family from Google Fonts. Upload a .woff2, .woff, .ttf, or .otf file to use a custom face."
                  />
                  <div className="rounded-xl border border-[#e5e5e5] bg-white p-4">
                    <p className="admin-muted mb-2 text-xs uppercase tracking-wide">Preview</p>
                    <p
                      className="text-2xl font-light tracking-tight text-dq-black"
                      style={{ fontFamily: cssFontFamilyStack(fontFamily || DEFAULT_FONT_FAMILY) }}
                    >
                      Donate Quran — Faith. Knowledge. Impact.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {tab === 'footer' ? (
            footer ? (
              <>
                <p className="admin-muted text-sm">Contact details and legal copy shown in the site footer.</p>
                <div>
                  <FieldLabel>About text</FieldLabel>
                  <textarea
                    className="admin-input min-h-20"
                    value={footer.about_text}
                    onChange={(e) => setFooter({ ...footer, about_text: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <input
                      className="admin-input"
                      type="email"
                      value={footer.email}
                      onChange={(e) => setFooter({ ...footer, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>Copyright</FieldLabel>
                    <input
                      className="admin-input"
                      value={footer.copyright}
                      onChange={(e) => setFooter({ ...footer, copyright: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Developer credit</FieldLabel>
                    <input
                      className="admin-input"
                      value={footer.developer_credit ?? ''}
                      onChange={(e) => setFooter({ ...footer, developer_credit: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <FooterMissingMessage />
            )
          ) : null}

          {tab === 'social' ? (
            footer ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="admin-muted text-sm">Shown in the footer and on the Contact page.</p>
                  <button type="button" className="admin-btn-secondary" onClick={addSocialLink}>
                    Add link
                  </button>
                </div>
                {socialLinks.length === 0 ? (
                  <p className="admin-muted text-sm">No social links yet.</p>
                ) : (
                  <div className="space-y-3">
                    {socialLinks.map((link, index) => (
                      <div
                        key={`${link.label}-${index}`}
                        className="grid grid-cols-1 gap-3 rounded-xl border border-[#e5e5e5] p-3 md:grid-cols-[1fr_2fr_auto]"
                      >
                        <div>
                          <FieldLabel>Label</FieldLabel>
                          <input
                            className="admin-input"
                            value={link.label}
                            onChange={(e) => updateSocialLink(index, { label: e.target.value })}
                            placeholder="Facebook"
                          />
                        </div>
                        <div>
                          <FieldLabel>URL</FieldLabel>
                          <input
                            className="admin-input"
                            type="url"
                            value={link.href}
                            onChange={(e) => updateSocialLink(index, { href: e.target.value })}
                            placeholder="https://"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            className="admin-btn-danger w-full md:w-auto"
                            onClick={() => removeSocialLink(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <FooterMissingMessage />
            )
          ) : null}

          {tab === 'apps' ? (
            <>
              <p className="admin-muted text-sm">Used in the site header download buttons.</p>
              <div>
                <FieldLabel>Apple App Store URL</FieldLabel>
                <input
                  className="admin-input"
                  type="url"
                  value={appStoreUrl}
                  onChange={(e) => setAppStoreUrl(e.target.value)}
                  placeholder="https://apps.apple.com/..."
                />
              </div>
              <div>
                <FieldLabel>Google Play Store URL</FieldLabel>
                <input
                  className="admin-input"
                  type="url"
                  value={playStoreUrl}
                  onChange={(e) => setPlayStoreUrl(e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                />
              </div>
            </>
          ) : null}

          {tab === 'navigation' ? (
            <>
              <p className="admin-muted text-sm">
                Header and footer menu links are managed in the database navigation table. Contact support to add or
                reorder main nav items.
              </p>
              <p className="text-sm font-medium text-dq-black">{nav.length} navigation links configured</p>
            </>
          ) : null}

          {tab === 'payments' ? <AdminPaymentsSettings /> : null}
    </div>
  )
}
