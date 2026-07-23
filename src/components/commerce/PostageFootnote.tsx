import type { TrustBlock } from '#/lib/cms/types'
import { cn } from '#/lib/utils'

type PostageFootnoteProps = {
  block?: TrustBlock
  className?: string
}

export function PostageFootnote({ block, className }: PostageFootnoteProps) {
  if (!block?.bodyHtml) return null

  return (
    <div
      className={cn(
        'text-xs leading-relaxed text-dq-muted [&_p]:text-xs [&_p]:text-dq-muted',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: block.bodyHtml }}
    />
  )
}
