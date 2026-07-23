import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { BooksPage } from '#/components/pages/BooksPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllBooks } from '#/lib/cms/loadBooks'

export const Route = createFileRoute('/books/')({
  loader: async () => {
    const [cms, books] = await Promise.all([loadCmsSnapshot(), loadAllBooks()])
    return { cms, books }
  },
  head: () => ({ meta: [{ title: "Books of the Qur'an — Donate Quran" }] }),
  component: BooksRoute,
})

function BooksRoute() {
  const { cms, books } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <BooksPage books={books} />
    </PublicLayout>
  )
}
