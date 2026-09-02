import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '#/components/home/HomePage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadDonatePresets } from '#/lib/commerce/catalog'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [cms, presets] = await Promise.all([loadCmsSnapshot(), loadDonatePresets()])
    return { cms, presets }
  },
  component: IndexPage,
})

function IndexPage() {
  const { cms, presets } = Route.useLoaderData()
  return <HomePage data={cms} presets={presets} />
}
