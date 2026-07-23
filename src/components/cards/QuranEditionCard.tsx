import { Link } from '@tanstack/react-router'
import { Download } from 'lucide-react'
import { motion } from 'motion/react'
import type { QuranEdition } from '#/lib/cms/types'
import { Button } from '#/components/ui/button'

export function QuranEditionCard({ edition }: { edition: QuranEdition }) {
  return (
    <motion.article whileHover={{ y: -4 }} className="group flex h-full flex-col">
      <Link to={`/quran/${edition.slug}`} className="block overflow-hidden">
        <img
          src={edition.featuredImageUrl}
          alt={edition.language}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link to={`/quran/${edition.slug}`} className="block">
          <h3 className="line-clamp-1 text-sm font-light leading-snug tracking-tight text-dq-black transition-colors group-hover:text-dq-gold lg:text-base">
            {edition.language}
          </h3>
        </Link>
        {edition.pdfUrl ? (
          <div className="mt-auto">
            <Button
              asChild
              variant="gold"
              size="sm"
              className="h-7 w-full gap-1 px-2 text-[0.625rem] tracking-[0.12em]"
            >
              <a href={edition.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-3 w-3 shrink-0" />
                DOWNLOAD PDF
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </motion.article>
  )
}
