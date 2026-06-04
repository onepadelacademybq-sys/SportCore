'use client'

import dynamic from 'next/dynamic'
import type { EvaluationSummary } from '@/actions/evaluations'

const AdminEvalPanel = dynamic(
  () => import('./admin-eval-panel').then(m => m.AdminEvalPanel),
  { ssr: false },
)

interface Props {
  evaluations: EvaluationSummary[]
  coaches:     { id: string; full_name: string }[]
  players:     { id: string; full_name: string }[]
}

export function AdminEvalPanelDynamic(props: Props) {
  return <AdminEvalPanel {...props} />
}
