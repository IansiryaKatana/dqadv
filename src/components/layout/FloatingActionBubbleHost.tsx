import { useRouterState } from '@tanstack/react-router'
import { useCms } from '#/contexts/CmsContext'
import { FloatingActionBubble } from './FloatingActionBubble'

export function FloatingActionBubbleHost() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data } = useCms()

  if (pathname.startsWith('/backend')) return null

  return (
    <FloatingActionBubble
      key="floating-donate"
      donateUrl={data?.siteSettings.donate_url ?? '/donate'}
    />
  )
}
