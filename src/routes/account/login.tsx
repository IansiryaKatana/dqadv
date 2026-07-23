import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AccountLoginPage } from '#/components/pages/AccountLoginPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/account/login')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Sign In — Donate Quran' }] }),
  component: LoginRoute,
})

function LoginRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <AccountLoginPage />
    </PublicLayout>
  )
}
