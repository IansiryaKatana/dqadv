import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/videos')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content/videos' })
  },
})
