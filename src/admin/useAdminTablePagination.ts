import { useMemo, useState } from 'react'

export function useAdminTablePagination<T>(rows: T[], pageSize = 20) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

  return {
    page,
    setPage,
    totalPages,
    pageRows,
    pageSize,
    total: rows.length,
  }
}
