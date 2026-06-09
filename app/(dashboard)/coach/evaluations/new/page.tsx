import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPlayers } from '@/actions/evaluations'
import { EvaluationForm } from '@/components/evaluations/evaluation-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Nueva evaluación' }

interface Props {
  searchParams: Promise<{ player?: string }>
}

export default async function CoachNewEvaluationPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [players, { player: defaultPlayer }] = await Promise.all([
    getPlayers(),
    searchParams,
  ])

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Nueva evaluación</h1>
        <p className="text-muted-foreground text-sm mt-1">Protocolo V3 — completa los módulos disponibles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formulario de evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <EvaluationForm
            role="coach"
            currentUserId={user.id}
            players={players}
            defaultPlayerId={defaultPlayer}
          />
        </CardContent>
      </Card>
    </div>
  )
}
