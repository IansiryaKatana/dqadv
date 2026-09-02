import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/donate/$slug')({
  beforeLoad: ({ params }) => {
    const slug = params.slug.toLowerCase()
    const orderSlugs = new Set([
      'single-quran-request',
      'quran-english-translation',
      'quran-free-copy',
      'family-quran-package',
      'bulk-pallet-order',
    ])
    throw redirect({
      to: orderSlugs.has(slug) ? '/order-free-qurans' : '/donate',
    })
  },
})
