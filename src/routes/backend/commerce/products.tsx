import { createFileRoute } from '@tanstack/react-router'
import { AdminProducts } from '#/admin/AdminProducts'

export const Route = createFileRoute('/backend/commerce/products')({
  component: AdminProducts,
})
