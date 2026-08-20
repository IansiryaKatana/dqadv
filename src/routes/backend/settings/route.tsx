import { createFileRoute } from '@tanstack/react-router'
import { AdminSettingsLayout } from '#/admin/AdminSettingsLayout'

export const Route = createFileRoute('/backend/settings')({
  component: AdminSettingsLayout,
})
