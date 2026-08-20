import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/quran-editions')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content/quran-editions' })
  },
})
