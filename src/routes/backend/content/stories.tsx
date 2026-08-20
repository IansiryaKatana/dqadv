import { createFileRoute } from '@tanstack/react-router'
import { AdminStories } from '#/admin/AdminStories'

export const Route = createFileRoute('/backend/content/stories')({
  component: AdminStories,
})
