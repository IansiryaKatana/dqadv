import { createFileRoute } from '@tanstack/react-router'
import { AdminForgotPassword } from '#/admin/AdminForgotPassword'

export const Route = createFileRoute('/backend/forgot-password')({
  head: () => ({ meta: [{ title: 'Reset Admin Password — Donate Quran' }] }),
  component: AdminForgotPassword,
})
