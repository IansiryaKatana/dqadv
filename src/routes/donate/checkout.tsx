import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { CheckoutPage } from '#/components/pages/CheckoutPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/donate/checkout')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Complete Your Gift — Donate Quran' }] }),
  component: CheckoutRoute,
})

function CheckoutRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <CheckoutPage
        bankBlock={data.trust.byKey.bank_payment}
        postageNote={data.trust.byKey.postage_packaging}
      />
    </PublicLayout>
  )
}
