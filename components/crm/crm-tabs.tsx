'use client'

import { useState } from 'react'
import { LeadsPipeline }  from './leads-pipeline'
import { RetentionBoard } from './retention-board'
import type { LeadWithInteraction, RetentionGroups } from '@/app/(dashboard)/admin/crm/page'

interface Props {
  leads: LeadWithInteraction[]
  retention: RetentionGroups
  leadStats: Record<string, number>
}

export function CrmTabs({ leads, retention, leadStats }: Props) {
  const [tab, setTab] = useState<'pipeline' | 'retencion'>('pipeline')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6">
        {([
          { id: 'pipeline',  label: 'Pipeline de Prospectos' },
          { id: 'retencion', label: 'Retención de Estudiantes' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'pipeline'  && <LeadsPipeline  leads={leads} />}
      {tab === 'retencion' && <RetentionBoard retention={retention} />}
    </div>
  )
}
