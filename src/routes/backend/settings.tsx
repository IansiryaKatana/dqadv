import { createFileRoute } from '@tanstack/react-router'
import { AdminSite } from '#/admin/AdminSite'

export const Route = createFileRoute('/backend/settings')({
  component: AdminSite,
})
