export function AdminTablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="admin-muted mt-4 flex items-center justify-between text-sm">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button type="button" className="admin-btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button type="button" className="admin-btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}
