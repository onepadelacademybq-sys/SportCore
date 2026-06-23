import { Badge } from '@/components/ui/badge'

const CONFIG: Record<string, { label: string; className: string }> = {
  '5ta_masculino': { label: '5ta Masculino',            className: 'bg-blue-500/15 text-blue-400' },
  '6ta_masculino': { label: '6ta Masculino',            className: 'bg-indigo-500/15 text-indigo-400' },
  '7ma_masculino': { label: '7ma Masculino',            className: 'bg-violet-500/15 text-violet-400' },
  'femenino_d':    { label: 'Femenino D',               className: 'bg-pink-500/15 text-pink-400' },
  'femenino_c':    { label: 'Femenino C',               className: 'bg-rose-500/15 text-rose-400' },
  'juvenil_s18':   { label: 'Juvenil S18',              className: 'bg-emerald-500/15 text-emerald-400' },
  'juvenil_s16':   { label: 'Juvenil S16',              className: 'bg-teal-500/15 text-teal-400' },
  'juvenil_s14':   { label: 'Juvenil S14',              className: 'bg-cyan-500/15 text-cyan-400' },
  'prejuvenil':    { label: 'Prejuvenil (8-12)',         className: 'bg-amber-500/15 text-amber-400' },
  'baby_padel':    { label: 'Baby Pádel (5-9)',          className: 'bg-orange-500/15 text-orange-400' },
}

export function LevelBadge({ level }: { level: string }) {
  const cfg = CONFIG[level] ?? { label: level, className: 'bg-muted text-muted-foreground' }
  return <Badge className={cfg.className}>{cfg.label}</Badge>
}
