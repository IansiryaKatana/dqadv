import { createFileRoute } from '@tanstack/react-router'
import { AdminLogin } from '#/admin/AdminLogin'

export const Route = createFileRoute('/backend/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: AdminLogin,
})
