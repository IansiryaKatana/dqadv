import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AccountResetPasswordPage } from '#/components/pages/AccountResetPasswordPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/account/reset-password')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Set New Password — Donate Quran' }] }),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <AccountResetPasswordPage />
    </PublicLayout>
  )
}
