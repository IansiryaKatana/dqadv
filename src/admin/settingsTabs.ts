export const SETTINGS_SITE_TABS = [
  { id: 'branding', label: 'Branding', to: '/backend/settings/branding' },
  { id: 'footer', label: 'Footer', to: '/backend/settings/footer' },
  { id: 'social', label: 'Social', to: '/backend/settings/social' },
  { id: 'apps', label: 'Apps', to: '/backend/settings/apps' },
  { id: 'navigation', label: 'Navigation', to: '/backend/settings/navigation' },
  { id: 'payments', label: 'Payments & Email', to: '/backend/settings/payments' },
] as const

export type SettingsSiteTab = (typeof SETTINGS_SITE_TABS)[number]['id']

export function isSettingsSiteTab(value: string): value is SettingsSiteTab {
  return SETTINGS_SITE_TABS.some((tab) => tab.id === value)
}
