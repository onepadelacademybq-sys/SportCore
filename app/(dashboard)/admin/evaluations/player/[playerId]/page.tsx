import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPlayerEvolution } from '@/actions/evaluations'
import { PlayerEvolutionCharts } from '@/components/evaluations/player-evolution-charts'
import type { PlayerEvolutionPoint } from '@/actions/evaluations'

export const metadata: Metadata = { title: 'Evolución del jugador' }

interface Props {
  params: Promise<{ playerId: string }>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function techLevel(pct: number | null): { label: string; cls: string } {
  if (pct === null) return { label: '—', cls: 'text-muted-foreground' }
  if (pct >= 70)   return { label: 'Avanzado',      cls: 'bg-emerald-500/10 text-emerald-500' }
  if (pct >= 40)   return { label: 'En desarrollo', cls: 'bg-amber-500/10 text-amber-500' }
  return               { label: 'Inicial',       cls: 'bg-red-500/10 text-red-400' }
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
    </div>
  )
}

function evalStats(points: PlayerEvolutionPoint[]) {
  const withTech  = points.filter(p => p.techTotal !== null)
  const latest    = withTech.at(-1)?.techTotal ?? null
  const best      = withTech.length ? Math.max(...withTech.map(p => p.techTotal!)) : null
  const first     = withTech.at(0)?.techTotal ?? null
  const delta     = latest !== null && first !== null ? Math.round((latest - first) * 10) / 10 : null
  return { latest, best, delta, total: points.length }
}

export default async function PlayerEvolutionPage({ params }: Props) {
  const { playerId } = await params
  const data = await getPlayerEvolution(playerId)
  if (!data) notFound()

  const { player, points } = data
  const { latest, best, delta, total } = evalStats(points)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div>
        <Link href="/admin/evaluations">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Evaluaciones
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{player.full_name}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Dashboard de evolución progresiva · {total} evaluación{total !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* ── Summary stats ────────────────────────────────────────── */}
      {points.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBadge label="Evaluaciones" value={String(total)} />
          <StatBadge label="% Técnico actual" value={latest !== null ? `${latest}%` : '—'} />
          <StatBadge label="% Técnico mejor" value={best !== null ? `${best}%` : '—'} />
          <StatBadge
            label="Evolución total"
            value={delta !== null ? `${delta > 0 ? '+' : ''}${delta}%` : '—'}
          />
        </div>
      )}

      {/* ── Charts ───────────────────────────────────────────────── */}
      {points.length < 2 ? (
        <div className="rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">
          Se necesitan al menos 2 evaluaciones para mostrar gráficos de evolución.
        </div>
      ) : (
        <PlayerEvolutionCharts points={points} />
      )}

      {/* ── Evaluation table ─────────────────────────────────────── */}
      {points.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div
            className="grid text-[10px] font-medium text-muted-foreground bg-muted/40 px-4 py-2 uppercase tracking-wide"
            style={{ gridTemplateColumns: '1fr 120px 90px 110px' }}
          >
            <span>Evaluación</span>
            <span className="text-center">Fecha</span>
            <span className="text-center">% Técnico</span>
            <span className="text-center">Nivel</span>
          </div>

          {/* Rows — newest first */}
          {[...points].reverse().map(p => {
            const level = techLevel(p.techTotal)
            return (
              <Link key={p.evaluationId} href={`/admin/evaluations/${p.evaluationId}`}>
                <div
                  className="grid px-4 py-3 border-t border-border items-center hover:bg-muted/30 transition-colors"
                  style={{ gridTemplateColumns: '1fr 120px 90px 110px' }}
                >
                  <span className="text-sm font-medium truncate pr-3">{p.title}</span>
                  <span className="text-center text-xs text-muted-foreground">{formatDate(p.date)}</span>
                  <span className="text-center text-sm font-semibold tabular-nums">
                    {p.techTotal !== null ? `${p.techTotal}%` : '—'}
                  </span>
                  <div className="flex justify-center">
                    {p.techTotal !== null ? (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${level.cls}`}>
                        {level.label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin datos</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {points.length === 0 && (
        <div className="rounded-lg border border-border p-10 text-center text-sm text-muted-foreground">
          Este jugador no tiene evaluaciones registradas.
        </div>
      )}
    </div>
  )
}
