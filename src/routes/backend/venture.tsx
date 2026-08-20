import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/venture')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content/venture' })
  },
})
