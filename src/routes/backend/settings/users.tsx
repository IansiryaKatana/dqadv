import { createFileRoute } from '@tanstack/react-router'
import { AdminUsers } from '#/admin/AdminUsers'

export const Route = createFileRoute('/backend/settings/users')({
  component: AdminUsers,
})
