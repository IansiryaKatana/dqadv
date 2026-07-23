import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { AccountForgotPasswordPage } from '#/components/pages/AccountForgotPasswordPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'

export const Route = createFileRoute('/account/forgot-password')({
  loader: () => loadCmsSnapshot(),
  head: () => ({ meta: [{ title: 'Reset Password — Donate Quran' }] }),
  component: ForgotPasswordRoute,
})

function ForgotPasswordRoute() {
  const data = Route.useLoaderData()
  return (
    <PublicLayout data={data}>
      <AccountForgotPasswordPage />
    </PublicLayout>
  )
}
