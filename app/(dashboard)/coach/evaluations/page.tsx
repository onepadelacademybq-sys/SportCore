import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllEvaluations, getPlayers } from '@/actions/evaluations'
import { EvalList } from '@/components/evaluations/eval-list'

export const metadata: Metadata = { title: 'Evaluaciones' }

export default async function CoachEvaluationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [evaluations, players] = await Promise.all([getAllEvaluations(user.id), getPlayers()])

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Evaluaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de evaluaciones del Protocolo V3
        </p>
      </div>

      <EvalList evaluations={evaluations} role="coach" players={players} />
    </div>
  )
}
