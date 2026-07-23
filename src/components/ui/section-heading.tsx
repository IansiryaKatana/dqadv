import { cn } from '#/lib/utils'

type SectionHeadingProps = {
  eyebrow?: string
  title: string
  highlight?: string
  subtitle?: string
  subtitleOnNewLine?: boolean
  align?: 'left' | 'center'
  className?: string
  headingClassName?: string
  dark?: boolean
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  subtitle,
  subtitleOnNewLine = true,
  align = 'left',
  className,
  headingClassName,
  dark,
}: SectionHeadingProps) {
  return (
    <div className={cn(align === 'center' && 'text-center', className)}>
      {eyebrow ? <p className={cn('type-eyebrow mb-3', dark ? 'text-dq-gold' : 'text-dq-muted')}>{eyebrow}</p> : null}
      <h2 className={cn('type-headline', dark ? 'text-white' : 'text-dq-black', headingClassName)}>
        {title}
        {highlight ? (
          <>
            {' '}
            <span className="text-dq-gold">{highlight}</span>
          </>
        ) : null}
        {subtitle ? (
          subtitleOnNewLine ? (
            <>
              <br />
              <span className={dark ? 'text-white' : 'text-dq-black'}>{subtitle}</span>
            </>
          ) : (
            <>
              {' '}
              <span className={dark ? 'text-white' : 'text-dq-black'}>{subtitle}</span>
            </>
          )
        ) : null}
      </h2>
    </div>
  )
}
