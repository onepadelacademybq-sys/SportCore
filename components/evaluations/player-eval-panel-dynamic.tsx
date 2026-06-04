'use client'

import dynamic from 'next/dynamic'
import type { EvaluationSummary } from '@/actions/evaluations'

const PlayerEvalPanel = dynamic(
  () => import('./player-eval-panel').then(m => m.PlayerEvalPanel),
  { ssr: false },
)

export function PlayerEvalPanelDynamic({ pendingEvals }: { pendingEvals: EvaluationSummary[] }) {
  return <PlayerEvalPanel pendingEvals={pendingEvals} />
}
