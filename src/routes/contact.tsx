import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { ContactPage } from '#/components/pages/ContactPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/contact')({
  loader: () => loadCmsSnapshot(),
  head: () => ({
    meta: [{ title: 'Contact Us — Donate Quran' }],
  }),
  component: ContactRoute,
})

function ContactRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <ContactPage footer={data.footer} />
    </PublicLayout>
  )
}
