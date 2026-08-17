import { Link } from '@tanstack/react-router'
import { PayPalIcon } from '#/components/icons/PayPalIcon'
import { StoreDownloadButtons } from './StoreDownloadButtons'
import { cn } from '#/lib/utils'

type HeaderActionsProps = {
  appStoreUrl?: string
  playStoreUrl?: string
  donateUrl?: string
  className?: string
}

const donateButtonClass =
  'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-paypal-blue bg-paypal-blue px-5 text-white transition-colors hover:border-[#005ea6] hover:bg-[#005ea6]'

export function HeaderActions({ appStoreUrl, playStoreUrl, donateUrl = '/donate', className }: HeaderActionsProps) {
  return (
    <div className={cn('flex shrink-0 items-center gap-2', className)}>
      <StoreDownloadButtons appStoreUrl={appStoreUrl} playStoreUrl={playStoreUrl} />

      <Link to={donateUrl} className={cn(donateButtonClass, 'w-10 px-0 2xl:hidden')} aria-label="Donate with PayPal">
        <PayPalIcon className="h-[1.125rem] w-[1.125rem]" />
      </Link>

      <Link to={donateUrl} className={cn(donateButtonClass, 'type-label hidden px-6 2xl:inline-flex')}>
        <PayPalIcon className="h-4 w-4" />
        Donate
      </Link>
    </div>
  )
}
