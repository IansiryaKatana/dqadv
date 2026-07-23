import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Database } from '#/integrations/supabase/database.types'
import { getSupabase } from '#/integrations/supabase/client'
import { DEFAULT_FAVICON, DEFAULT_LOGO_DARK, DEFAULT_LOGO_LIGHT } from '#/lib/site/branding'
import { useCms } from '#/contexts/CmsContext'
import { useAdminPageHeader } from './AdminPageContext'
import { cn } from '#/lib/utils'
import { ImageUploadField } from './components/ImageUploadField'
import { AdminPaymentsSettings } from './AdminPaymentsSettings'

type NavRow = Database['public']['Tables']['dq_navigation_links']['Row']
type FooterRow = Database['public']['Tables']['dq_footer_settings']['Row']

type SocialLink = { label: string; href: string }

const SETTINGS_TABS = [
  { id: 'branding', label: 'Branding' },
  { id: 'footer', label: 'Footer' },
  { id: 'social', label: 'Social' },
  { id: 'apps', label: 'Apps' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'payments', label: 'Payments & Email' },
] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]['id']

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

export function AdminSite() {
  const { refetch } = useCms()
  const [nav, setNav] = useState<NavRow[]>([])
  const [footer, setFooter] = useState<FooterRow | null>(null)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [appStoreUrl, setAppStoreUrl] = useState('')
  const [playStoreUrl, setPlayStoreUrl] = useState('')
  const [logoLightUrl, setLogoLightUrl] = useState('')
  const [logoDarkUrl, setLogoDarkUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding')

  async function refresh() {
    const sb = getSupabase()
    if (!sb) return
    const [navRes, footerRes, settingsRes] = await Promise.all([
      sb.from('dq_navigation_links').select('*').order('sort_order'),
      sb.from('dq_footer_settings').select('*').limit(1).maybeSingle(),
      sb.from('dq_site_settings').select('*'),
    ])
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
  }

  useEffect(() => {
    void refresh()
  }, [])

  const saveAll = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    setSaving(true)
    setErr(null)

    const settingsRes = await sb.from('dq_site_settings').upsert(
      [
        { key: 'app_store_url', value: appStoreUrl.trim() },
        { key: 'play_store_url', value: playStoreUrl.trim() },
        { key: 'logo_light_url', value: logoLightUrl.trim() },
        { key: 'logo_dark_url', value: logoDarkUrl.trim() },
        { key: 'favicon_url', value: faviconUrl.trim() },
      ],
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
  }, [footer, socialLinks, appStoreUrl, playStoreUrl, logoLightUrl, logoDarkUrl, faviconUrl, refetch])

  const headerActions = useMemo(
    () =>
      [{ label: saving ? 'Saving…' : 'Save settings', onClick: () => void saveAll() }],
    [saveAll, saving],
  )

  useAdminPageHeader({
    title: 'Settings',
    description: 'Branding, payments, email, footer contact, social links, and app download URLs.',
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
    <div>
      {err ? <p className="mb-4 text-sm text-red-400">{err}</p> : null}

      <div className="admin-panel overflow-hidden">
        <div className="border-b border-[#e5e5e5] px-4 pt-3">
          <div className="admin-tabs mb-0 border-b-0" role="tablist" aria-label="Settings sections">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn('admin-tab', activeTab === tab.id && 'admin-tab-active')}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          {activeTab === 'branding' ? (
            <>
              <p className="admin-muted text-sm">
                Upload a logo for light and dark backgrounds, plus a favicon. Leave empty to use the built-in defaults.
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
            </>
          ) : null}

          {activeTab === 'footer' ? (
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

          {activeTab === 'social' ? (
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

          {activeTab === 'apps' ? (
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

          {activeTab === 'navigation' ? (
            <>
              <p className="admin-muted text-sm">
                Header and footer menu links are managed in the database navigation table. Contact support to add or
                reorder main nav items.
              </p>
              <p className="text-sm font-medium text-dq-black">{nav.length} navigation links configured</p>
            </>
          ) : null}

          {activeTab === 'payments' ? <AdminPaymentsSettings /> : null}
        </div>
      </div>
    </div>
  )
}
