import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '#/lib/utils'

export type AdminSelectOption = {
  value: string
  label: string
}

type AdminSelectProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: AdminSelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AdminSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  className,
  disabled,
}: AdminSelectProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <SelectPrimitive.Root value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          'admin-input flex cursor-pointer items-center justify-between gap-2 text-left',
          'data-[placeholder]:text-[#737373]',
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-[#737373]" aria-hidden />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'z-[100] max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        >
          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1 text-[#737373]">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="max-h-[min(20rem,var(--radix-select-content-available-height))] p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-3 text-sm text-[#171717] outline-none',
                  'data-[highlighted]:bg-[#f7f7f5] data-[highlighted]:text-[#171717]',
                  'data-[state=checked]:font-medium',
                )}
              >
                <span className="absolute left-2 flex size-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="size-3.5 text-[#f4b000]" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1 text-[#737373]">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
