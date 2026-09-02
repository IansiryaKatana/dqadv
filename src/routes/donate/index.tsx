import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { DonatePage } from '#/components/pages/DonatePage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadDonatePresets } from '#/lib/commerce/catalog'

export const Route = createFileRoute('/donate/')({
  loader: async () => {
    const [cms, presets] = await Promise.all([loadCmsSnapshot(), loadDonatePresets()])
    return { cms, trust: cms.trust, presets }
  },
  head: () => ({
    meta: [
      { title: 'Give — Donate Quran' },
      { name: 'description', content: 'Give a one-time or monthly gift to fund Qur’an printing and distribution.' },
    ],
  }),
  component: DonateRoute,
})

function DonateRoute() {
  const { cms, trust, presets } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <DonatePage presets={presets} trust={trust} />
    </PublicLayout>
  )
}
