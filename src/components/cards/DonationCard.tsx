import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import type { DonationProduct } from '#/lib/cms/types'
import { AddToGiftButton } from '#/components/commerce/AddToGiftButton'
import { formatPrice } from '#/lib/utils'

export function DonationCard({ product }: { product: DonationProduct }) {
  const price = formatPrice(product.price ?? null, product.currency ?? 'GBP')
  const detailHref = `/donate/${product.slug}`

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <Link to={detailHref} className="block overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link to={detailHref}>
          <h3 className="type-title text-dq-black transition-colors group-hover:text-dq-gold">{product.title}</h3>
        </Link>
        <p className="type-body flex-1 text-dq-muted">{product.description}</p>
        {price ? <p className="type-body text-dq-black">{price}</p> : null}
        <AddToGiftButton product={product} className="mt-auto" />
      </div>
    </motion.article>
  )
}
