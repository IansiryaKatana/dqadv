import { createFileRoute } from '@tanstack/react-router'
import { AdminVideos } from '#/admin/AdminVideos'

export const Route = createFileRoute('/backend/content/videos')({
  component: AdminVideos,
})
