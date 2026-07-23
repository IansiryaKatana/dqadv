import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { NotFoundPage } from '#/components/pages/NotFoundPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/$')({
  loader: () => loadCmsSnapshot(),
  component: NotFoundRoute,
})

function NotFoundRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <NotFoundPage />
    </PublicLayout>
  )
}
