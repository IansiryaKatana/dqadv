import { createFileRoute } from '@tanstack/react-router'
import { AdminBooks } from '#/admin/AdminBooks'

export const Route = createFileRoute('/backend/content/books')({
  component: AdminBooks,
})
