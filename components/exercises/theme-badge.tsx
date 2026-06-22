import { cn } from '@/lib/utils'

const CONFIG: Record<string, { label: string; className: string }> = {
  calentamiento:    { label: 'Calentamiento',    className: 'bg-orange-500/15 text-orange-400' },
  tecnica:          { label: 'Técnica',          className: 'bg-blue-500/15 text-blue-400' },
  tactica:          { label: 'Táctica',          className: 'bg-indigo-500/15 text-indigo-400' },
  fisico:           { label: 'Físico',           className: 'bg-emerald-500/15 text-emerald-400' },
  mental:           { label: 'Mental',           className: 'bg-violet-500/15 text-violet-400' },
  vuelta_a_la_calma: { label: 'Vuelta a la calma', className: 'bg-brand/15 text-brand' },
}

export function ThemeBadge({ theme }: { theme: string }) {
  const cfg = CONFIG[theme] ?? { label: theme, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', cfg.className)}>
      {cfg.label}
    </span>
  )
}

export const THEME_OPTIONS = Object.entries(CONFIG).map(([value, { label }]) => ({ value, label }))
