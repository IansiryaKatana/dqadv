import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/trust-content')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content/trust-content' })
  },
})
