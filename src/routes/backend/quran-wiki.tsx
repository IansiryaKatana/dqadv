import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/backend/quran-wiki')({
  beforeLoad: () => {
    throw redirect({ to: '/backend/content/quran-wiki' })
  },
})
