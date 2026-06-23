'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  page:       number
  totalPages: number
  total:      number
  pageSize:   number
}

export function BookingsPagination({ page, totalPages, total, pageSize }: Props) {
  const params = useSearchParams()

  if (totalPages <= 1) return null

  function pageUrl(p: number) {
    const next = new URLSearchParams(params.toString())
    if (p === 1) next.delete('page')
    else         next.set('page', String(p))
    const qs = next.toString()
    return `/admin/bookings${qs ? `?${qs}` : ''}`
  }

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  // Build page window: always show first, last, and up to 3 around current
  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-xs text-muted-foreground">
        {from}–{to} de {total} reservas
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={pageUrl(page - 1)}
          aria-disabled={page === 1}
          className={`p-1.5 rounded-md transition-colors ${
            page === 1
              ? 'pointer-events-none text-muted-foreground/30'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
          ) : (
            <Link
              key={p}
              href={pageUrl(p as number)}
              className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </Link>
          )
        )}

        <Link
          href={pageUrl(page + 1)}
          aria-disabled={page === totalPages}
          className={`p-1.5 rounded-md transition-colors ${
            page === totalPages
              ? 'pointer-events-none text-muted-foreground/30'
              : 'hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
