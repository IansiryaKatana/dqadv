import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { DonationProduct } from '#/lib/cms/types'
import { AddToGiftButton } from '#/components/commerce/AddToGiftButton'

export function QuickDonationCard({ product }: { product: DonationProduct }) {
  const detailHref = `/donate/${product.slug}`

  return (
    <motion.article whileHover={{ y: -4 }} className="group overflow-hidden rounded-2xl bg-white shadow-md">
      <Link to={detailHref}>
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-64"
        />
      </Link>
      <div className="space-y-3 p-6">
        <Link to={detailHref}>
          <h3 className="type-title text-dq-black transition-colors group-hover:text-dq-gold">{product.title}</h3>
        </Link>
        <p className="type-body text-dq-muted">{product.description}</p>
        <AddToGiftButton product={product} />
      </div>
    </motion.article>
  )
}
