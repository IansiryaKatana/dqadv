import { createFileRoute } from '@tanstack/react-router'
import { AdminBooks } from '#/admin/AdminBooks'

export const Route = createFileRoute('/backend/books')({
  component: AdminBooks,
})
