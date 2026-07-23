import { createFileRoute } from '@tanstack/react-router'
import { AdminResetPassword } from '#/admin/AdminResetPassword'

export const Route = createFileRoute('/backend/reset-password')({
  head: () => ({ meta: [{ title: 'Set Admin Password — Donate Quran' }] }),
  component: AdminResetPassword,
})
