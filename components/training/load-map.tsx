import { CONTENT_PHASES, CONTENT_PHASE_BY_VALUE } from '@/lib/planning/load-phases'

const VOL_COLOR = '#22c55e'
const INT_COLOR = '#ef4444'

type LoadWeek = {
  id:                string
  content_phase:     string | null
  planned_volume:    number | null
  planned_intensity: number | null
}

// Recibe los microciclos YA ORDENADOS (semana asc; en el macro, meso-por-meso).
// Usa la posición como número de semana continuo.
export function LoadMap({ microcycles }: { microcycles: LoadWeek[] }) {
  if (microcycles.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">Mapa de carga</h3>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {microcycles.map((w, i) => {
            const ph = w.content_phase ? CONTENT_PHASE_BY_VALUE[w.content_phase] : null
            return (
              <div key={w.id} className="flex flex-col items-center gap-1 w-9">
                <span className="text-[10px] text-muted-foreground">S{i + 1}</span>
                <div className="flex items-end justify-center gap-0.5 h-20 w-full">
                  <div className="w-2.5 h-full rounded-sm bg-muted relative overflow-hidden">
                    <div className="absolute bottom-0 w-full" style={{ height: `${w.planned_volume ?? 0}%`, background: VOL_COLOR }} />
                  </div>
                  <div className="w-2.5 h-full rounded-sm bg-muted relative overflow-hidden">
                    <div className="absolute bottom-0 w-full" style={{ height: `${w.planned_intensity ?? 0}%`, background: INT_COLOR }} />
                  </div>
                </div>
                {ph ? (
                  <div className="w-full h-6 rounded text-[10px] font-bold flex items-center justify-center text-white" style={{ background: ph.color }}>
                    {ph.short}
                  </div>
                ) : (
                  <div className="w-full h-6 rounded border border-dashed border-border text-[10px] text-muted-foreground flex items-center justify-center">·</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-3 text-[10px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-sm" style={{ background: VOL_COLOR }} />Volumen</span>
        <span className="flex items-center gap-1"><i className="inline-block w-2 h-2 rounded-sm" style={{ background: INT_COLOR }} />Intensidad</span>
        {CONTENT_PHASES.map((p) => (
          <span key={p.value} className="flex items-center gap-1">
            <i className="inline-block w-2 h-2 rounded-sm" style={{ background: p.color }} />{p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
