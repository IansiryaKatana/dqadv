import { createFileRoute } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { ArticlesPage } from '#/components/pages/ArticlesPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllArticles } from '#/lib/cms/loadArticles'

export const Route = createFileRoute('/articles/')({
  loader: async () => {
    const [cms, posts] = await Promise.all([loadCmsSnapshot(), loadAllArticles()])
    return { cms, posts }
  },
  head: () => ({
    meta: [
      { title: 'Articles — Donate Quran' },
      { name: 'description', content: 'Read reflections, guides, and impact stories from Donate Quran.' },
    ],
  }),
  component: ArticlesRoute,
})

function ArticlesRoute() {
  const { cms, posts } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <ArticlesPage posts={posts} />
    </PublicLayout>
  )
}
