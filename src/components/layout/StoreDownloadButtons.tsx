import { ChevronDown, Smartphone } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { cn } from '#/lib/utils'

type StoreDownloadButtonsProps = {
  appStoreUrl?: string
  playStoreUrl?: string
  className?: string
}

function AppStoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4 fill-current', className)} aria-hidden>
      <path d="M16.365 1.43c0 1.14-.493 2.22-1.277 3.034-.788.81-2.04 1.358-3.152 1.27-.12-1.106.48-2.272 1.234-3.06.84-.87 2.303-1.5 3.195-1.244zm1.378 4.33c-1.874-.108-3.47 1.066-4.36 1.066-.91 0-2.303-1.04-3.79-1.01-1.95.03-3.75 1.13-4.76 2.88-2.03 3.52-.52 8.73 1.46 11.6 1 1.44 2.17 3.06 3.72 3 1.5-.06 2.06-.97 3.87-.97 1.8 0 2.3.97 3.86.94 1.6-.03 2.62-1.46 3.6-2.91 1.14-1.66 1.61-3.27 1.64-3.35-.04-.02-3.15-1.21-3.18-4.8-.03-3 2.48-4.44 2.59-4.52-1.41-2.07-3.6-2.34-4.37-2.38z" />
    </svg>
  )
}

function PlayStoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-4 w-4', className)} aria-hidden>
      <path
        fill="currentColor"
        d="M3.6 1.8c-.3.2-.5.6-.5 1v18.4c0 .4.2.8.5 1l.1.1 10.3-10.3v-.2L3.7 1.7l-.1.1zm11.4 7.5-2.5-2.5 7.8-4.5c.4-.2.7-.2 1-.1l-6.3 6.1zM12.5 12 4.2 20.3c.3.1.6.1 1-.1l7.3-4.2-2.5-2.5zm1 1 2.5 2.5 2.5-1.4c.7-.4.7-1.4 0-1.8l-2.5-1.4-2.5 1.1z"
      />
    </svg>
  )
}

export function StoreDownloadButtons({
  appStoreUrl = 'https://apps.apple.com',
  playStoreUrl = 'https://play.google.com/store',
  className,
}: StoreDownloadButtonsProps) {
  const hasAppStore = Boolean(appStoreUrl)
  const hasPlayStore = Boolean(playStoreUrl)

  if (!hasAppStore && !hasPlayStore) return null

  if (hasAppStore && !hasPlayStore) {
    return (
      <a
        href={appStoreUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-dq-black bg-dq-black px-4 text-white transition-colors hover:border-dq-gold hover:bg-dq-soft-black',
          className,
        )}
        aria-label="Download on the App Store"
      >
        <AppStoreIcon />
        <span className="hidden text-[0.7rem] font-normal tracking-wide 2xl:inline">App Store</span>
      </a>
    )
  }

  if (!hasAppStore && hasPlayStore) {
    return (
      <a
        href={playStoreUrl}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-dq-gold bg-dq-gold px-4 text-dq-on-gold transition-colors hover:border-dq-black hover:bg-dq-black hover:text-white',
          className,
        )}
        aria-label="Get it on Google Play"
      >
        <PlayStoreIcon />
        <span className="hidden text-[0.7rem] font-normal tracking-wide 2xl:inline">Google Play</span>
      </a>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-dq-black bg-dq-black px-3 text-white transition-colors hover:border-dq-gold hover:bg-dq-soft-black 2xl:px-4',
            className,
          )}
          aria-label="Get the app"
        >
          <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden text-[0.7rem] font-normal tracking-wide 2xl:inline">Get the app</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        <DropdownMenuItem asChild>
          <a href={appStoreUrl} target="_blank" rel="noreferrer" className="no-underline">
            <AppStoreIcon className="text-dq-black" />
            <span className="flex flex-col leading-none">
              <span className="text-[0.55rem] font-extralight tracking-[0.12em] text-dq-muted">Download on the</span>
              <span className="text-sm font-medium">App Store</span>
            </span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={playStoreUrl} target="_blank" rel="noreferrer" className="no-underline">
            <PlayStoreIcon className="text-dq-gold" />
            <span className="flex flex-col leading-none">
              <span className="text-[0.55rem] font-extralight tracking-[0.12em] text-dq-muted">Get it on</span>
              <span className="text-sm font-medium">Google Play</span>
            </span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
