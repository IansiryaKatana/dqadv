import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '#/lib/utils'

type AdminModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
  stacked?: boolean
}

export function AdminModal({ open, onOpenChange, title, children, footer, wide, stacked }: AdminModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn('fixed inset-0 bg-black/40', stacked ? 'z-[70]' : 'z-50')} />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'admin-panel admin-modal admin-sheet fixed flex flex-col overflow-hidden rounded-none shadow-2xl outline-none',
            stacked ? 'z-[70]' : 'z-50',
            'inset-x-0 bottom-0 max-h-[92vh] w-full',
            'md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-full',
            wide ? 'md:max-w-3xl' : 'md:max-w-xl',
          )}
        >
          <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3 md:px-6">
            <Dialog.Title className="text-lg font-bold text-dq-black">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-2 text-dq-black hover:bg-black/5" aria-label="Close dialog">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">{children}</div>
          {footer ? <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5] px-4 py-3 md:px-6">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
