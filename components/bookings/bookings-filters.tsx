'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

export function BookingsFilters() {
  const router      = useRouter()
  const params      = useSearchParams()
  const [, startTransition] = useTransition()

  const [q,    setQ]    = useState(params.get('q')    ?? '')
  const [date, setDate] = useState(params.get('date') ?? '')

  function buildUrl(overrides: Record<string, string>) {
    const next = new URLSearchParams(params.toString())
    // Reset to page 1 whenever a filter changes
    next.delete('page')
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else    next.delete(k)
    })
    return `/admin/bookings?${next.toString()}`
  }

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      startTransition(() => router.push(buildUrl({ q })))
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function handleDateChange(val: string) {
    setDate(val)
    startTransition(() => router.push(buildUrl({ date: val })))
  }

  function clearAll() {
    setQ('')
    setDate('')
    startTransition(() => router.push('/admin/bookings'))
  }

  const hasFilters = q || date || params.get('status')

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48 max-w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar jugador o entrenador…"
          className="pl-8 h-8 text-sm"
        />
      </div>

      <Input
        type="date"
        value={date}
        onChange={(e) => handleDateChange(e.target.value)}
        className="h-8 text-sm w-auto"
        title="Filtrar por fecha"
      />

      {hasFilters && (
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
