import { createFileRoute } from '@tanstack/react-router'
import { AdminStories } from '#/admin/AdminStories'

export const Route = createFileRoute('/backend/stories')({
  component: AdminStories,
})
