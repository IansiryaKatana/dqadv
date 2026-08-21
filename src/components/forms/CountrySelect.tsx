import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
import { COUNTRIES, filterCountries } from '#/lib/countries'
import { formControlClass } from '#/components/ui/form-controls'
import { cn } from '#/lib/utils'

type CountrySelectProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

export function CountrySelect({
  id,
  value,
  onValueChange,
  placeholder = 'Select country',
  required,
  className,
  disabled,
}: CountrySelectProps) {
  const listId = useId()
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => filterCountries(query), [query])
  const selected = COUNTRIES.find((country) => country.name === value)

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  function selectCountry(name: string) {
    onValueChange(name)
    setOpen(false)
    setQuery('')
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const next = results[activeIndex]
      if (next) selectCountry(next.name)
    }
  }

  return (
    <div className="relative">
      <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (disabled) return
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-required={required}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            formControlClass,
            'flex cursor-pointer items-center justify-between gap-2 text-left',
            !value && 'text-dq-muted/70',
            className,
          )}
        >
          <span className="truncate">{selected?.name ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-dq-muted" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popper-anchor-width)] overflow-hidden rounded-xl border border-dq-border bg-white shadow-lg outline-none"
        >
          <div className="flex items-center gap-2 border-b border-dq-border px-3 py-2">
            <Search className="size-4 shrink-0 text-dq-muted" aria-hidden />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search countries"
              aria-controls={listId}
              aria-activedescendant={results[activeIndex] ? `${listId}-${results[activeIndex].code}` : undefined}
              className="w-full bg-transparent py-1 text-sm text-dq-black outline-none placeholder:text-dq-muted/70"
            />
          </div>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-dq-muted">No countries found.</p>
            ) : (
              results.map((country, index) => {
                const isSelected = country.name === value
                const isActive = index === activeIndex
                return (
                  <button
                    key={country.code}
                    type="button"
                    id={`${listId}-${country.code}`}
                    role="option"
                    aria-selected={isSelected}
                    data-index={index}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-dq-black outline-none',
                      isActive && 'bg-dq-cream',
                      isSelected && 'font-medium',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectCountry(country.name)}
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center">
                      {isSelected ? <Check className="size-3.5 text-dq-gold" /> : null}
                    </span>
                    <span className="truncate">{country.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      ) : null}
      </Popover.Root>
    </div>
  )
}
