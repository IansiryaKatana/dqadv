import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '#/integrations/supabase/client'
import { useAdminPageHeader } from './AdminPageContext'

type DashboardStats = {
  gifts: number
  orders: number
  monthly: number
  printCost: number
  postage: number
  copies: number
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
        setStats({
          gifts: 0,
          orders: 0,
          monthly: 0,
          printCost: 0,
          postage: 0,
          copies: 0,
          stories: 0,
          blogPosts: 0,
          wikiArticles: 0,
        })
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const [giftsRes, ordersRes, storiesRes, articlesRes, wikiRes, subsRes, orderRowsRes] = await Promise.all([
        sb.from('dq_donations').select('*', { count: 'exact', head: true }).eq('order_kind', 'donation').eq('payment_status', 'paid'),
        sb.from('dq_donations').select('*', { count: 'exact', head: true }).eq('order_kind', 'quran_order').eq('payment_status', 'paid'),
        sb.from('dq_story_posters').select('*', { count: 'exact', head: true }),
        sb.from('dq_articles').select('*', { count: 'exact', head: true }),
        sb.from('dq_quran_wiki_articles').select('*', { count: 'exact', head: true }),
        sb.from('dq_donation_subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        sb
          .from('dq_donations')
          .select('items_subtotal, postage_total, cart_snapshot')
          .eq('order_kind', 'quran_order')
          .eq('payment_status', 'paid'),
      ])

      const failed = [giftsRes, ordersRes, storiesRes, articlesRes, wikiRes, subsRes, orderRowsRes].find((res) => res.error)
      if (failed?.error) {
        setError(failed.error.message)
        setStats(null)
      } else {
        const orderRows = (orderRowsRes.data ?? []) as Array<{
          items_subtotal?: number | null
          postage_total?: number | null
          cart_snapshot?: { copies?: number } | null
        }>
        setStats({
          gifts: giftsRes.count ?? 0,
          orders: ordersRes.count ?? 0,
          monthly: subsRes.count ?? 0,
          printCost: orderRows.reduce((sum, row) => sum + Number(row.items_subtotal ?? 0), 0),
          postage: orderRows.reduce((sum, row) => sum + Number(row.postage_total ?? 0), 0),
          copies: orderRows.reduce((sum, row) => {
            const snapshot = row.cart_snapshot as { copies?: number } | null
            return sum + Number(snapshot && typeof snapshot === 'object' ? snapshot.copies ?? 0 : 0)
          }, 0),
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
    { label: 'Paid gifts', value: stats?.gifts },
    { label: 'Qur’an orders', value: stats?.orders },
    { label: 'Active monthly', value: stats?.monthly },
    { label: 'Copies posted', value: stats?.copies },
    { label: 'Print contribution', value: stats ? `£${stats.printCost.toFixed(0)}` : undefined },
    { label: 'Postage collected', value: stats ? `£${stats.postage.toFixed(0)}` : undefined },
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
          <Link to="/backend/content/hero" className="admin-btn-primary">
            Edit hero
          </Link>
          <Link to="/backend/commerce/donations" className="admin-btn-secondary">
            Gifts & orders
          </Link>
          <Link to="/backend/commerce/give-presets" className="admin-btn-secondary">
            Give presets
          </Link>
          <Link to="/backend/commerce/postage" className="admin-btn-secondary">
            Postage tiers
          </Link>
          <Link to="/backend/content/articles" className="admin-btn-secondary">
            Manage articles
          </Link>
          <Link to="/backend/content/quran-wiki" className="admin-btn-secondary">
            Manage Qur&apos;an Wiki
          </Link>
        </div>
      </div>
    </div>
  )
}
