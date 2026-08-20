import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/settings/')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/settings/branding' })
  },
})
