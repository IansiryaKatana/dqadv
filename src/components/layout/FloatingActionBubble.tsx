import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { PayPalIcon } from '#/components/icons/PayPalIcon'
import { cn } from '#/lib/utils'

type FloatingActionBubbleProps = {
  donateUrl?: string
  className?: string
}

const donateFabClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-full border border-paypal-blue bg-paypal-blue text-white shadow-[0_8px_24px_rgba(0,112,186,0.35)] transition-transform hover:scale-105 hover:border-[#005ea6] hover:bg-[#005ea6] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-dq-gold'

export function FloatingActionBubble({ donateUrl = '/donate', className }: FloatingActionBubbleProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  const bubble = (
    <Link
      to={donateUrl}
      className={cn(
        'pointer-events-auto fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[55] visible',
        donateFabClass,
        className,
      )}
      aria-label="Donate with PayPal"
    >
      <PayPalIcon className="h-5 w-5" />
    </Link>
  )

  if (portalTarget) {
    return createPortal(bubble, portalTarget)
  }

  return bubble
}
