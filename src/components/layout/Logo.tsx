import { Link } from '@tanstack/react-router'
import { resolveLogoDark, resolveLogoLight } from '#/lib/site/branding'
import { cn } from '#/lib/utils'

type LogoProps = {
  className?: string
  variant?: 'light' | 'dark'
  lightSrc?: string
  darkSrc?: string
}

export function Logo({ className, variant = 'light', lightSrc, darkSrc }: LogoProps) {
  const src = variant === 'dark' ? resolveLogoDark(darkSrc) : resolveLogoLight(lightSrc)

  return (
    <Link to="/" className={cn('inline-flex shrink-0', className)} aria-label="Donate Qur'an home">
      <img src={src} alt="Donate Quran" className="h-9 w-auto md:h-10" width={80} height={40} />
    </Link>
  )
}
