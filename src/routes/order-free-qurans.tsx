import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/order-free-qurans')({
  beforeLoad: () => {
    throw redirect({ to: '/about', hash: 'our-promise' })
  },
})
