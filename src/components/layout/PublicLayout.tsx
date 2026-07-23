import type { ReactNode } from 'react'
import type { CmsSnapshot } from '#/lib/cms/types'
import { BrandingHead } from '#/components/layout/BrandingHead'
import { Header } from '#/components/layout/Header'
import { Footer } from '#/components/layout/Footer'
import { CartDrawer } from '#/components/commerce/CartDrawer'

type PublicLayoutProps = {
  data: CmsSnapshot
  children: ReactNode
}

export function PublicLayout({ data, children }: PublicLayoutProps) {
  const { siteSettings } = data

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <BrandingHead faviconUrl={siteSettings.favicon_url} />
      <Header
        links={data.navigation}
        appStoreUrl={siteSettings.app_store_url}
        playStoreUrl={siteSettings.play_store_url}
        donateUrl={siteSettings.donate_url ?? '/donate'}
        logoLightUrl={siteSettings.logo_light_url}
        logoDarkUrl={siteSettings.logo_dark_url}
      />
      <main className="flex-1">{children}</main>
      <Footer
        footer={data.footer}
        links={data.navigation}
        logoLightUrl={siteSettings.logo_light_url}
        logoDarkUrl={siteSettings.logo_dark_url}
      />
      <CartDrawer />
    </div>
  )
}
