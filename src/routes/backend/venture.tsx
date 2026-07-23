import { createFileRoute } from '@tanstack/react-router'
import { AdminVenture } from '#/admin/AdminVenture'

export const Route = createFileRoute('/backend/venture')({
  component: AdminVenture,
})
