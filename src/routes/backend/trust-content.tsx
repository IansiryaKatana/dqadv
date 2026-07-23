import { createFileRoute } from '@tanstack/react-router'
import { AdminTrustContent } from '#/admin/AdminTrustContent'

export const Route = createFileRoute('/backend/trust-content')({
  component: AdminTrustContent,
})
