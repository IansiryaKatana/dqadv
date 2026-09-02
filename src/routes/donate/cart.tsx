import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/donate/cart')({
  beforeLoad: () => {
    throw redirect({ to: '/donate' })
  },
})
