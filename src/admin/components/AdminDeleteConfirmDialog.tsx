import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

type AdminDeleteConfirmDialogProps = {
  open: boolean
  description: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function AdminDeleteConfirmDialog({
  open,
  description,
  busy = false,
  onCancel,
  onConfirm,
}: AdminDeleteConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content
          aria-describedby="admin-delete-confirm-description"
          className="admin-panel fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 shadow-2xl outline-none"
        >
          <div className="flex items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
            <Dialog.Title className="text-lg font-bold text-dq-black">Delete confirmation</Dialog.Title>
            <Dialog.Close
              className="rounded-full p-2 text-dq-black hover:bg-black/5 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Close dialog"
              disabled={busy}
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="px-4 py-4">
            <Dialog.Description id="admin-delete-confirm-description" className="text-sm leading-relaxed text-[#555]">
              {description}
            </Dialog.Description>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-[#e5e5e5] px-4 py-3">
            <button type="button" className="admin-btn-secondary" disabled={busy} onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className="admin-btn-danger" disabled={busy} onClick={onConfirm}>
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
