import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { PrivacyPolicyPage } from '#/components/pages/PrivacyPolicyPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/privacy-policy')({
  loader: () => loadCmsSnapshot(),
  head: () => ({
    meta: [
      { title: 'Privacy Policy — Donate Quran' },
      {
        name: 'description',
        content:
          'Privacy policy for Donate Quran by Mercy 4 All Foundation. How we collect, use, and protect your information.',
      },
    ],
  }),
  component: PrivacyPolicyRoute,
})

function PrivacyPolicyRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <PrivacyPolicyPage />
    </PublicLayout>
  )
}
