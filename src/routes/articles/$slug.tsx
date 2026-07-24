import { createFileRoute, notFound } from '@tanstack/react-router'
import { PublicLayout } from '#/components/layout/PublicLayout'
import { ArticleDetailPage } from '#/components/pages/ArticleDetailPage'
import { loadCmsSnapshot } from '#/lib/cms/loadCmsSnapshot'
import { loadAllArticles, loadArticleBySlug } from '#/lib/cms/loadArticles'

export const Route = createFileRoute('/articles/$slug')({
  loader: async ({ params }) => {
    const [cms, post, allPosts] = await Promise.all([
      loadCmsSnapshot(),
      loadArticleBySlug({ data: { slug: params.slug } }),
      loadAllArticles(),
    ])
    if (!post) throw notFound()
    const related = allPosts.filter((p) => p.id !== post.id).slice(0, 2)
    return { cms, post, related }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.post.title ?? 'Article'} — Donate Quran` },
      { name: 'description', content: loaderData?.post.excerpt },
    ],
  }),
  component: ArticleDetailRoute,
})

function ArticleDetailRoute() {
  const { cms, post, related } = Route.useLoaderData()
  return (
    <PublicLayout data={cms}>
      <ArticleDetailPage post={post} related={related} />
    </PublicLayout>
  )
}
