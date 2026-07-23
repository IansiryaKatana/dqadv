import { createFileRoute, notFound } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { BookDetailPage } from '#/components/pages/BookDetailPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllBooks, loadBookBySlug } from '#/lib/cms/loadBooks'

export const Route = createFileRoute('/books/$slug')({
  loader: async ({ params }) => {
    const [cms, book, allBooks] = await Promise.all([
      loadCmsSnapshot(),
      loadBookBySlug(params.slug),
      loadAllBooks(),
    ])
    if (!book) throw notFound()
    return { cms, book, related: allBooks.filter((b) => b.id !== book.id).slice(0, 15) }
  },
  component: BookDetailRoute,
})

function BookDetailRoute() {
  const { cms, book, related } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <BookDetailPage book={book} related={related} />
    </PublicLayout>
  )
}
