import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/donations')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/commerce/donations' })
  },
})
