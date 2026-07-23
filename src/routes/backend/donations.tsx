import { createFileRoute } from '@tanstack/react-router'
import { AdminDonations } from '#/admin/AdminDonations'

export const Route = createFileRoute('/backend/donations')({
  component: AdminDonations,
})
