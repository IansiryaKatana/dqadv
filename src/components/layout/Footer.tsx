import { Link } from '@tanstack/react-router'
import type { FooterSettings, NavLink } from '#/lib/cms/types'
import { Container } from '#/components/ui/container'
import { Logo } from './Logo'

type FooterProps = {
  footer: FooterSettings
  links: NavLink[]
  logoLightUrl?: string
  logoDarkUrl?: string
}

export function Footer({ footer, links, logoLightUrl, logoDarkUrl }: FooterProps) {
  const quickLinks = links.filter((l) => l.showInFooter && l.footerGroup === 'quick_links')
  const resources = links.filter((l) => l.showInFooter && l.footerGroup === 'resources')

  return (
    <footer className="bg-dq-black text-white">
      <Container className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo variant="dark" lightSrc={logoLightUrl} darkSrc={logoDarkUrl} />
          <p className="type-body max-w-xs text-white/70">{footer.aboutText}</p>
        </div>

        <div>
          <h3 className="type-eyebrow mb-4 text-dq-gold">Quick Links</h3>
          <ul className="type-body space-y-2 text-white/80">
            {quickLinks.map((link) => (
              <li key={link.id}>
                <Link to={link.href} className="hover:text-dq-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="type-eyebrow mb-4 text-dq-gold">Resources</h3>
          <ul className="type-body space-y-2 text-white/80">
            {resources.map((link) => (
              <li key={link.id}>
                <Link to={link.href} className="hover:text-dq-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="type-eyebrow mb-4 text-dq-gold">Contact Us</h3>
          <ul className="type-body space-y-2 text-white/80">
            <li>
              <a href={`mailto:${footer.email}`} className="hover:text-dq-gold">
                {footer.email}
              </a>
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            {footer.socialLinks.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="type-eyebrow text-dq-gold hover:underline">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
          <p>{footer.copyright}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy-policy" className="hover:text-dq-gold">
              Privacy Policy
            </Link>
            {footer.developerCredit ? <p>{footer.developerCredit}</p> : null}
          </div>
        </Container>
      </div>
    </footer>
  )
}
