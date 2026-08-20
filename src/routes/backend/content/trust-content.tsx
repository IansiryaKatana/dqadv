import { createFileRoute } from '@tanstack/react-router'
import { AdminTrustContent } from '#/admin/AdminTrustContent'

export const Route = createFileRoute('/backend/content/trust-content')({
  component: AdminTrustContent,
})
