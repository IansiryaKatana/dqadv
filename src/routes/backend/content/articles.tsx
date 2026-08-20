import { createFileRoute } from '@tanstack/react-router'
import { AdminArticles } from '#/admin/AdminArticles'

export const Route = createFileRoute('/backend/content/articles')({
  component: AdminArticles,
})
