import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '#/components/home/HomePage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadDonatePresets, loadPostageTiers } from '#/lib/commerce/catalog'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [cms, presets, postageTiers] = await Promise.all([
      loadCmsSnapshot(),
      loadDonatePresets(),
      loadPostageTiers(),
    ])
    return { cms, presets, postageTiers }
  },
  component: IndexPage,
})

function IndexPage() {
  const { cms, presets, postageTiers } = Route.useLoaderData()
  return <HomePage data={cms} presets={presets} postageTiers={postageTiers} />
}
