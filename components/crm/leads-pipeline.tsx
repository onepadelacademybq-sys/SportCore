'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, Phone, Plus, ChevronRight, Clock } from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { CreateLeadDialog }   from './create-lead-dialog'
import { WhatsAppComposer }   from './whatsapp-composer'
import { updateLeadStatus }   from '@/actions/crm'
import type { LeadWithInteraction } from '@/app/(dashboard)/admin/crm/page'

const COLUMNS: { id: string; label: string; color: string; dot: string }[] = [
  { id: 'new',             label: 'Nuevo',          color: 'bg-slate-500/10 border-slate-500/20',   dot: 'bg-slate-400' },
  { id: 'contacted',       label: 'Contactado',     color: 'bg-blue-500/10 border-blue-500/20',     dot: 'bg-blue-400' },
  { id: 'trial_scheduled', label: 'Clase agendada', color: 'bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-400' },
  { id: 'trial_done',      label: 'Clase hecha',    color: 'bg-amber-500/10 border-amber-500/20',   dot: 'bg-amber-400' },
  { id: 'converted',       label: 'Convertido',     color: 'bg-green-500/10 border-green-500/20',   dot: 'bg-green-400' },
  { id: 'lost',            label: 'Perdido',        color: 'bg-red-500/10 border-red-500/20',       dot: 'bg-red-400' },
]

const SOURCE_LABEL: Record<string, string> = {
  web_form:  'Web',
  instagram: 'Instagram',
  facebook:  'Facebook',
  referral:  'Referido',
  walk_in:   'Presencial',
  whatsapp:  'WhatsApp',
  other:     'Otro',
}

interface Props { leads: LeadWithInteraction[] }

export function LeadsPipeline({ leads }: Props) {
  const [waTarget, setWaTarget] = useState<{ phone: string; name: string; leadId: string } | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {leads.length} prospecto{leads.length !== 1 ? 's' : ''} en total
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo prospecto
        </Button>
      </div>

      {/* Kanban */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.id)
          return (
            <div key={col.id} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className={`rounded-t-lg border px-3 py-2 flex items-center gap-2 ${col.color}`}>
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wide">{col.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">{colLeads.length}</span>
              </div>

              {/* Cards */}
              <div className={`rounded-b-lg border border-t-0 min-h-32 p-2 space-y-2 ${col.color}`}>
                {colLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onWhatsApp={() =>
                      setWaTarget({
                        phone:  lead.whatsapp ?? lead.phone,
                        name:   lead.name,
                        leadId: lead.id,
                      })
                    }
                  />
                ))}
                {colLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin prospectos</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showCreate && <CreateLeadDialog onClose={() => setShowCreate(false)} />}

      {waTarget && (
        <WhatsAppComposer
          phone={waTarget.phone}
          name={waTarget.name}
          leadId={waTarget.leadId}
          onClose={() => setWaTarget(null)}
        />
      )}
    </div>
  )
}

function LeadCard({ lead, onWhatsApp }: { lead: LeadWithInteraction; onWhatsApp: () => void }) {
  const [isPending, startTransition] = useTransition()
  const lastInteraction = lead.interactions[0]
  const daysAgo = lastInteraction
    ? Math.floor((Date.now() - new Date(lastInteraction.createdAt).getTime()) / 86_400_000)
    : null

  const nextStatus: Record<string, string> = {
    new:             'contacted',
    contacted:       'trial_scheduled',
    trial_scheduled: 'trial_done',
    trial_done:      'converted',
  }
  const next = nextStatus[lead.status]

  function advance() {
    if (!next) return
    startTransition(async () => {
      await updateLeadStatus(lead.id, next as Parameters<typeof updateLeadStatus>[1])
    })
  }

  return (
    <div className="bg-background rounded-lg border p-3 space-y-2 text-sm">
      <div className="flex items-start justify-between gap-1">
        <p className="font-semibold leading-tight">{lead.name}</p>
        <Badge variant="outline" className="text-[10px] shrink-0">
          {SOURCE_LABEL[lead.source] ?? lead.source}
        </Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="h-3 w-3" />
        {lead.phone}
      </div>

      {lead.sport && (
        <p className="text-xs text-muted-foreground">🏃 {lead.sport}</p>
      )}

      {lastInteraction && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="truncate">{lastInteraction.summary}</span>
          {daysAgo !== null && <span className="shrink-0">· {daysAgo}d</span>}
        </div>
      )}

      <div className="flex gap-1.5 pt-1">
        <button
          onClick={onWhatsApp}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
        >
          <MessageCircle className="h-3 w-3" /> WA
        </button>
        {next && (
          <button
            onClick={advance}
            disabled={isPending}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors ml-auto"
          >
            Avanzar <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
