import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '#/components/home/HomePage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/')({
  loader: () => loadCmsSnapshot(),
  component: IndexPage,
})

function IndexPage() {
  const data = Route.useLoaderData()
  return <HomePage data={data} />
}
