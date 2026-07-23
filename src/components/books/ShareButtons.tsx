import { useEffect, useState } from 'react'
import { Check, Facebook, Link2, Linkedin, Share2, Twitter } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

type ShareButtonsProps = {
  title: string
  url?: string
  className?: string
}

export function ShareButtons({ title, url, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [shareUrl, setShareUrl] = useState(url ?? '')

  useEffect(() => {
    setShareUrl(url ?? window.location.href)
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [url])

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (!shareUrl || !navigator.share) return
    try {
      await navigator.share({ title, url: shareUrl })
    } catch {
      /* user cancelled */
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="type-label mr-1 text-dq-muted">Share</span>
      {canNativeShare ? (
        <Button type="button" variant="outline" size="icon" onClick={() => void nativeShare()} aria-label="Share">
          <Share2 className="h-4 w-4" strokeWidth={2} />
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} aria-label="Copy link">
        {copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Link2 className="h-4 w-4" strokeWidth={2} />}
      </Button>
      <Button type="button" variant="outline" size="icon" asChild>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4" strokeWidth={2} />
        </a>
      </Button>
      <Button type="button" variant="outline" size="icon" asChild>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on X"
        >
          <Twitter className="h-4 w-4" strokeWidth={2} />
        </a>
      </Button>
      <Button type="button" variant="outline" size="icon" asChild>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" strokeWidth={2} />
        </a>
      </Button>
    </div>
  )
}
