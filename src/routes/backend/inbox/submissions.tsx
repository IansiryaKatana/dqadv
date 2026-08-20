import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/inbox/submissions')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/submissions/contact' })
  },
})
