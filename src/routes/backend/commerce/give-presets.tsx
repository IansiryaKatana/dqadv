import { createFileRoute } from '@tanstack/react-router'
import { AdminGivePresets } from '#/admin/AdminGivePresets'

export const Route = createFileRoute('/backend/commerce/give-presets')({
  component: AdminGivePresets,
})
