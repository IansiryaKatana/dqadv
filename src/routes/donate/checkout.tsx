import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/donate/checkout')({
  component: () => <Outlet />,
})
