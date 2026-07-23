import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AccountRegisterPage } from '#/components/pages/AccountRegisterPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/account/register')({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === 'string' ? search.email : undefined,
    reference: typeof search.reference === 'string' ? search.reference : undefined,
  }),
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Create Account — Donate Quran' }] }),
  component: RegisterRoute,
})

function RegisterRoute() {
  const data = Route.useLoaderData()
  const { email, reference } = Route.useSearch()
  return (
    <PublicLayout data={data}>
      <AccountRegisterPage initialEmail={email} reference={reference} />
    </PublicLayout>
  )
}
