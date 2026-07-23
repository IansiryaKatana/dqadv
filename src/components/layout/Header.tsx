import { useEffect, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import type { NavLink } from '#/lib/cms/types'
import { Logo } from './Logo'
import { HeaderActions } from './HeaderActions'
import { GiftCartButton } from '#/components/commerce/GiftCartButton'
import { AccountButton } from '#/components/layout/AccountButton'
import { cn } from '#/lib/utils'

type HeaderProps = {
  links: NavLink[]
  appStoreUrl?: string
  playStoreUrl?: string
  donateUrl?: string
  logoLightUrl?: string
  logoDarkUrl?: string
}

const headerX = 'px-5 md:px-8 lg:px-10 xl:px-12'

export function Header({
  links,
  appStoreUrl,
  playStoreUrl,
  donateUrl = '/donate',
  logoLightUrl,
  logoDarkUrl,
}: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const headerLinks = links.filter((l) => l.showInHeader)

  return (
    <header className={cn('sticky top-0 z-50 w-full bg-white transition-shadow', scrolled && 'shadow-md')}>
      <div className={cn('w-full border-b border-dq-border/50', headerX)}>
        <div className="grid h-[72px] w-full grid-cols-[auto_1fr_auto] items-center gap-3 lg:gap-4">
          <Logo className="shrink-0" lightSrc={logoLightUrl} darkSrc={logoDarkUrl} />

          <div className="relative hidden min-w-0 lg:block">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent"
              aria-hidden
            />
            <nav
              className="header-nav-scroll type-nav-link flex items-center justify-center gap-x-3 overflow-x-auto px-1 xl:gap-x-4 2xl:gap-x-5"
              aria-label="Main"
            >
              {headerLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.href}
                  className={cn(
                    'shrink-0 whitespace-nowrap py-2 text-dq-black transition-colors hover:text-dq-gold',
                    pathname === link.href && 'text-dq-gold',
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="col-start-3 flex shrink-0 items-center justify-self-end gap-2">
            <GiftCartButton />
            <AccountButton className="hidden sm:inline-flex" />
            <HeaderActions
              appStoreUrl={appStoreUrl}
              playStoreUrl={playStoreUrl}
              donateUrl={donateUrl}
            />

            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dq-border lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-dq-border bg-white lg:hidden"
          >
            <div className={cn('flex w-full flex-col divide-y divide-dotted divide-dq-border/60 py-4', headerX)}>
              {headerLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.href}
                  className={cn(
                    'type-body rounded-xl px-3 py-2.5 text-dq-black transition-colors hover:bg-dq-cream/60',
                    pathname === link.href && 'text-dq-gold',
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
