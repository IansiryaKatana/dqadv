import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/site')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/settings' })
  },
})
