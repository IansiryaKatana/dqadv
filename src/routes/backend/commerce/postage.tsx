import { createFileRoute } from '@tanstack/react-router'
import { AdminPostageTiers } from '#/admin/AdminPostageTiers'

export const Route = createFileRoute('/backend/commerce/postage')({
  component: AdminPostageTiers,
})
