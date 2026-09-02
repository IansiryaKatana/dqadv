import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/donate/checkout/')({
  beforeLoad: () => {
    throw redirect({ to: '/donate' })
  },
})
