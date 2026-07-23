import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '#/integrations/supabase/client'
import { useAdminPageHeader } from './AdminPageContext'

type DashboardStats = {
  products: number
  quickDonations: number
  stories: number
  blogPosts: number
  wikiArticles: number
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cmsMode = isSupabaseConfigured() ? 'live' : 'static'

  useEffect(() => {
    async function loadStats() {
      const sb = getSupabase()
      if (!sb) {
        setStats({ products: 0, quickDonations: 0, stories: 0, blogPosts: 0, wikiArticles: 0 })
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const [productsRes, quickRes, storiesRes, articlesRes, wikiRes] = await Promise.all([
        sb.from('dq_donation_products').select('*', { count: 'exact', head: true }).eq('kind', 'product'),
        sb.from('dq_donation_products').select('*', { count: 'exact', head: true }).eq('kind', 'quick'),
        sb.from('dq_story_posters').select('*', { count: 'exact', head: true }),
        sb.from('dq_articles').select('*', { count: 'exact', head: true }),
        sb.from('dq_quran_wiki_articles').select('*', { count: 'exact', head: true }),
      ])

      const failed = [productsRes, quickRes, storiesRes, articlesRes, wikiRes].find((res) => res.error)
      if (failed?.error) {
        setError(failed.error.message)
        setStats(null)
      } else {
        setStats({
          products: productsRes.count ?? 0,
          quickDonations: quickRes.count ?? 0,
          stories: storiesRes.count ?? 0,
          blogPosts: articlesRes.count ?? 0,
          wikiArticles: wikiRes.count ?? 0,
        })
      }

      setLoading(false)
    }

    void loadStats()
  }, [])

  const actions = useMemo(
    () => [{ label: 'View site', variant: 'secondary' as const, onClick: () => navigate({ to: '/' }) }],
    [navigate],
  )

  useAdminPageHeader({
    title: 'Dashboard',
    description: `CMS mode: ${loading ? 'loading' : cmsMode}. Changes appear on the public site after save and refetch.`,
    actions,
  })

  const statCards = [
    { label: 'Products', value: stats?.products },
    { label: 'Quick donations', value: stats?.quickDonations },
    { label: 'Stories', value: stats?.stories },
    { label: 'Blog posts', value: stats?.blogPosts },
    { label: 'Wiki articles', value: stats?.wikiArticles },
  ]

  return (
    <div>
      {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="admin-panel p-4">
            <p className="admin-muted text-sm">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-dq-gold">
              {loading || stat.value === undefined ? '—' : stat.value}
            </p>
          </div>
        ))}
      </div>
      <div className="admin-panel mt-6 p-4">
        <h2 className="font-semibold text-dq-black">Quick links</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/backend/hero" className="admin-btn-primary">
            Edit hero
          </Link>
          <Link to="/backend/products" className="admin-btn-secondary">
            Manage products
          </Link>
          <Link to="/backend/articles" className="admin-btn-secondary">
            Manage articles
          </Link>
          <Link to="/backend/quran-wiki" className="admin-btn-secondary">
            Manage Qur&apos;an Wiki
          </Link>
        </div>
      </div>
    </div>
  )
}
