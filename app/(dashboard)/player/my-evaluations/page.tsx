import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { getMyEvolution, getPlayerEvaluations } from '@/actions/evaluations'
import { PlayerEvolutionCharts }  from '@/components/evaluations/player-evolution-charts'
import { PlayerKPIs }             from '@/components/evaluations/player-kpis'
import { PlayerAnthroEvolution }  from '@/components/evaluations/player-anthro-evolution'
import { PlayerEvalPanelDynamic } from '@/components/evaluations/player-eval-panel-dynamic'
import type { PlayerEvolutionPoint } from '@/actions/evaluations'

export const metadata: Metadata = { title: 'Mis Evaluaciones' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })
}

function techLevel(pct: number | null) {
  if (pct === null) return { label: '—',            cls: 'text-muted-foreground' }
  if (pct >= 70)   return { label: 'Avanzado',      cls: 'bg-emerald-500/10 text-emerald-500' }
  if (pct >= 40)   return { label: 'En desarrollo', cls: 'bg-amber-500/10 text-amber-500' }
  return                   { label: 'Inicial',       cls: 'bg-red-500/10 text-red-400' }
}

function evalStats(points: PlayerEvolutionPoint[]) {
  const withTech = points.filter(p => p.techTotal !== null)
  const latest   = withTech.at(-1)?.techTotal ?? null
  const first    = withTech.at(0)?.techTotal  ?? null
  const delta    = latest !== null && first !== null
    ? Math.round((latest - first) * 10) / 10
    : null
  return { latest, first, delta, total: points.length }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="text-base font-semibold">{title}</h2>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PlayerMyEvaluationsPage() {
  const [evolution, allEvals] = await Promise.all([
    getMyEvolution(),
    getPlayerEvaluations(),
  ])

  if (!evolution) redirect('/login')

  const { points, groupKPIs, anthroPoints } = evolution
  const shared = allEvals.filter(e => e.isShared && e.evaluationStatus === 'completed')

  const { latest, delta, total } = evalStats(points)
  const level = techLevel(latest)

  // Index points by evaluationId for the shared-evals list
  const pointById = Object.fromEntries(points.map(p => [p.evaluationId, p]))

  const hasPhys = points.some(
    p => p.bestCMJ !== null || p.bestVel10m !== null || p.bestBolasLateral !== null,
  )

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold">Mis Evaluaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tu progreso técnico en el Protocolo V3
        </p>
      </div>

      {/* ── Panel de evaluaciones en curso ── */}
      <PlayerEvalPanelDynamic pendingEvals={allEvals} />

      {/* ── Empty state (resultados históricos) ── */}
      {points.length === 0 && (
        <div className="rounded-lg border border-border p-12 text-center space-y-2">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Aún no tenés evaluaciones registradas.</p>
          <p className="text-xs text-muted-foreground">Tu entrenador las agregará cuando estén listas.</p>
        </div>
      )}

      {points.length > 0 && (
        <>
          {/* ── 1. Resumen general ── */}
          <div className="space-y-3">
            <SectionHeading title="Resumen general" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label="% Técnico actual"
                value={latest !== null ? `${latest}%` : '—'}
              />
              <StatCard
                label="Evolución total"
                value={delta !== null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}
                sub={delta !== null ? (delta > 0 ? 'mejora' : delta < 0 ? 'baja' : 'sin cambio') : undefined}
              />
              <StatCard
                label="Evaluaciones"
                value={String(total)}
              />
              <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Nivel actual</p>
                {latest !== null ? (
                  <span className={`inline-block mt-1 text-sm font-semibold px-3 py-1 rounded-full ${level.cls}`}>
                    {level.label}
                  </span>
                ) : (
                  <p className="text-xl font-bold text-foreground">—</p>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. Gráfico de evolución técnica ── */}
          {points.length >= 2 && (
            <div className="space-y-3">
              <SectionHeading title="Evolución técnica" />
              <PlayerEvolutionCharts points={points} />
            </div>
          )}

          {/* ── 3. KPIs de mejora ── */}
          {groupKPIs.length > 0 && (
            <div className="space-y-3">
              <SectionHeading title="KPIs por categoría técnica" />
              <PlayerKPIs groupKPIs={groupKPIs} />
            </div>
          )}

          {/* ── 4. Evolución física ── */}
          {hasPhys && points.length >= 2 && (
            <div className="space-y-3">
              <SectionHeading title="Evolución física" />
              <PhysStats points={points} />
            </div>
          )}

          {/* ── Evolución antropométrica ── */}
          {anthroPoints.length > 0 && (
            <PlayerAnthroEvolution points={anthroPoints} />
          )}
        </>
      )}

      {/* ── 5. Lista de evaluaciones compartidas ── */}
      <div className="space-y-3">
        <SectionHeading title="Evaluaciones compartidas" />

        {shared.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center space-y-1">
            <ClipboardList className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Tu entrenador aún no ha compartido evaluaciones contigo.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <div className="min-w-[480px]">
            {/* Table header */}
            <div
              className="grid text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 px-4 py-2"
              style={{ gridTemplateColumns: '1fr 120px 90px 120px' }}
            >
              <span>Evaluación</span>
              <span className="text-center">Fecha</span>
              <span className="text-center">% Técnico</span>
              <span className="text-center">Nivel</span>
            </div>

            {shared.map(e => {
              const pt  = pointById[e.id]
              const pct = pt?.techTotal ?? null
              const lv  = techLevel(pct)
              return (
                <div
                  key={e.id}
                  className="grid px-4 py-3 border-t border-border items-center"
                  style={{ gridTemplateColumns: '1fr 120px 90px 120px' }}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    {e.coach && (
                      <p className="text-xs text-muted-foreground truncate">
                        Coach: {e.coach.full_name}
                      </p>
                    )}
                  </div>
                  <span className="text-center text-xs text-muted-foreground">
                    {formatDate(e.evaluatedAt)}
                  </span>
                  <span className="text-center text-sm font-semibold tabular-nums">
                    {pct !== null ? `${pct}%` : '—'}
                  </span>
                  <div className="flex justify-center">
                    {pct !== null ? (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${lv.cls}`}>
                        {lv.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin datos</span>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Physical summary cards ───────────────────────────────────────────────────

function PhysStats({ points }: { points: PlayerEvolutionPoint[] }) {
  const last = points.filter(p => p.bestCMJ !== null || p.bestVel10m !== null || p.bestBolasLateral !== null).at(-1)
  if (!last) return null

  const items: { label: string; value: string; unit: string; note: string }[] = []

  if (last.bestCMJ !== null)
    items.push({ label: 'CMJ', value: last.bestCMJ.toFixed(1), unit: 'cm', note: 'mejor marca' })
  if (last.bestVel10m !== null)
    items.push({ label: 'Velocidad 10m', value: last.bestVel10m.toFixed(3), unit: 's', note: 'mejor marca' })
  if (last.bestBolasLateral !== null)
    items.push({ label: 'Agilidad (8 bolas)', value: last.bestBolasLateral.toFixed(3), unit: 's', note: 'mejor marca' })

  if (items.length === 0) return null

  return (
    <div className={`grid gap-3 ${items.length === 1 ? 'grid-cols-1' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} sm:grid-cols-3`}>
      {items.map(item => (
        <div key={item.label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
          <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">
            {item.value}
            <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{item.note}</p>
        </div>
      ))}
    </div>
  )
}
