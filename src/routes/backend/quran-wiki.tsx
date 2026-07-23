import { createFileRoute } from '@tanstack/react-router'
import { AdminQuranWiki } from '#/admin/AdminQuranWiki'

export const Route = createFileRoute('/backend/quran-wiki')({
  component: AdminQuranWiki,
})
