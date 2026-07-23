import { useState } from 'react'
import type { TrustBlock } from '#/lib/cms/types'
import { cn } from '#/lib/utils'
import type { TrustSectionVariant } from './TrustHtmlSection'

const PREVIEW_CHAR_LIMIT = 145

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

type TrustColumnCardProps = {
  block: TrustBlock
  variant: TrustSectionVariant
}

export function TrustColumnCard({ block, variant }: TrustColumnCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isDark = variant === 'dark'
  const plainText = htmlToPlainText(block.bodyHtml)
  const canExpand = plainText.length > PREVIEW_CHAR_LIMIT
  const previewText = canExpand
    ? `${plainText.slice(0, PREVIEW_CHAR_LIMIT).trimEnd()}…`
    : plainText

  return (
    <div className="flex h-full flex-col">
      <h3
        className={cn(
          'mb-4 line-clamp-2 font-light leading-[1.2] tracking-tight',
          'text-xl md:text-2xl',
          'xl:mb-5 xl:h-[3.25rem] xl:text-[1.3rem] xl:leading-[1.25]',
          isDark ? 'text-white' : 'text-dq-black',
        )}
      >
        {block.title}
      </h3>

      <div
        className={cn(
          'flex-1',
          !expanded && 'xl:min-h-[7.25rem]',
        )}
      >
        {expanded ? (
          <div
            className={cn(
              'prose-dq [&_p]:type-body [&_p]:text-sm xl:[&_p]:text-sm',
              isDark ? '[&_p]:text-white/75 [&_strong]:text-white' : '[&_p]:text-dq-muted',
            )}
            dangerouslySetInnerHTML={{ __html: block.bodyHtml }}
          />
        ) : (
          <p
            className={cn(
              'type-body text-sm leading-relaxed',
              isDark ? 'text-white/75' : 'text-dq-muted',
            )}
          >
            {previewText}
          </p>
        )}
      </div>

      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className={cn(
            'type-label mt-4 self-start text-left transition-colors hover:underline',
            isDark ? 'text-dq-gold hover:text-white' : 'text-dq-gold hover:text-dq-black',
          )}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      ) : null}
    </div>
  )
}
