import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/articles')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content/articles' })
  },
})
