import { createFileRoute } from '@tanstack/react-router'
import { AdminHero } from '#/admin/AdminHero'

export const Route = createFileRoute('/backend/content/hero')({
  component: AdminHero,
})
