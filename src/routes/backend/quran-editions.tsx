import { createFileRoute } from '@tanstack/react-router'
import { AdminQuranEditions } from '#/admin/AdminQuranEditions'

export const Route = createFileRoute('/backend/quran-editions')({
  component: AdminQuranEditions,
})
