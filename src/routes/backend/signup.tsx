import { createFileRoute } from '@tanstack/react-router'
import { AdminSignup } from '#/admin/AdminSignup'

export const Route = createFileRoute('/backend/signup')({
  component: AdminSignup,
})
