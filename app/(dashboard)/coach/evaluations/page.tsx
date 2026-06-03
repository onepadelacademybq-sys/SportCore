import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAllEvaluations } from '@/actions/evaluations'
import { ClipboardList, Calendar, ChevronRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Evaluaciones' }

function formatScheduled(date: string | null, time: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ?? '00:00'}`)
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) +
    (time ? ` · ${time.slice(0, 5)}` : '')
}

export default async function CoachEvaluationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const all = await getAllEvaluations(user.id)
  const evaluations = all.filter(e =>
    e.evaluationStatus === 'confirmed' || e.evaluationStatus === 'completed',
  )

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Evaluaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Evaluaciones confirmadas asignadas a ti — Protocolo V3
        </p>
      </div>

      {evaluations.length === 0 ? (
        <div className="rounded-lg border border-border p-12 text-center space-y-2">
          <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No tienes evaluaciones confirmadas.</p>
          <p className="text-xs text-muted-foreground">El administrador te asignará evaluaciones una vez confirmado el pago.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
          {evaluations.map(ev => {
            const scheduled = formatScheduled(ev.scheduledDate, ev.scheduledTime)
            return (
              <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                {ev.evaluationStatus === 'confirmed'
                  ? <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                  : <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.player.full_name}</p>
                  {scheduled && (
                    <p className="text-xs text-muted-foreground mt-0.5">{scheduled}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Link href={`/coach/evaluations/${ev.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                      {ev.evaluationStatus === 'confirmed' ? 'Ingresar datos' : 'Ver evaluación'}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    ev.evaluationStatus === 'confirmed'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {ev.evaluationStatus === 'confirmed' ? 'Confirmada' : 'Completada'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
