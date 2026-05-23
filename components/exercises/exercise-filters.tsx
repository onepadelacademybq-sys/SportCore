'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { THEME_OPTIONS } from './theme-badge'
import { cn } from '@/lib/utils'

const LEVELS = [
  { value: '5ta_masculino', label: '5ta Masc.' },
  { value: '6ta_masculino', label: '6ta Masc.' },
  { value: '7ma_masculino', label: '7ma Masc.' },
  { value: 'femenino_d',    label: 'Fem. D' },
  { value: 'femenino_c',    label: 'Fem. C' },
  { value: 'juvenil_s18',   label: 'S18' },
  { value: 'juvenil_s16',   label: 'S16' },
  { value: 'juvenil_s14',   label: 'S14' },
  { value: 'prejuvenil',    label: 'Prejuv.' },
  { value: 'baby_padel',    label: 'Baby' },
]

const selectClass =
  'rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

export function ExerciseFilters() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const get = (key: string) => searchParams.get(key) ?? ''

  const push = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v)
        else params.delete(k)
      })
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  const favoritesOnly = get('favoritesOnly') === '1'

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar ejercicios..."
          defaultValue={get('search')}
          className="pl-8 h-9 text-sm"
          onChange={(e) => push({ search: e.target.value })}
        />
      </div>

      {/* Theme */}
      <select
        value={get('theme')}
        onChange={(e) => push({ theme: e.target.value })}
        className={selectClass}
      >
        <option value="">Todas las temáticas</option>
        {THEME_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Level */}
      <select
        value={get('level')}
        onChange={(e) => push({ level: e.target.value })}
        className={selectClass}
      >
        <option value="">Todos los niveles</option>
        {LEVELS.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>

      {/* Max duration */}
      <select
        value={get('maxDuration')}
        onChange={(e) => push({ maxDuration: e.target.value })}
        className={selectClass}
      >
        <option value="">Cualquier duración</option>
        <option value="15">≤ 15 min</option>
        <option value="30">≤ 30 min</option>
        <option value="45">≤ 45 min</option>
        <option value="60">≤ 60 min</option>
      </select>

      {/* Favorites toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('gap-2 h-9', favoritesOnly && 'border-rose-400 text-rose-400')}
        onClick={() => push({ favoritesOnly: favoritesOnly ? '' : '1' })}
      >
        <Heart className={cn('h-3.5 w-3.5', favoritesOnly && 'fill-current')} />
        Favoritos
      </Button>

      {/* Clear */}
      {(get('search') || get('theme') || get('level') || get('maxDuration') || favoritesOnly) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={() => router.push(pathname)}
        >
          Limpiar
        </Button>
      )}
    </div>
  )
}
