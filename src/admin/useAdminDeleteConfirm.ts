import { useCallback, useState } from 'react'

type DeleteLabels = {
  singular: string
  plural: string
}

type PendingDelete = {
  ids: string[]
  description: string
}

export function useAdminDeleteConfirm(labels: DeleteLabels) {
  const [pending, setPending] = useState<PendingDelete | null>(null)

  const request = useCallback(
    (ids: string[]) => {
      if (!ids.length) return
      const description =
        ids.length === 1
          ? `This will permanently delete this ${labels.singular}. This action cannot be undone.`
          : `This will permanently delete ${ids.length} ${labels.plural}. This action cannot be undone.`
      setPending({ ids, description })
    },
    [labels.plural, labels.singular],
  )

  const cancel = useCallback(() => setPending(null), [])

  return {
    open: pending !== null,
    description: pending?.description ?? '',
    pendingIds: pending?.ids ?? [],
    request,
    cancel,
  }
}
