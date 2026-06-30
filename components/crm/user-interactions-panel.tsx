'use client'

import { useState, useTransition } from 'react'
import {
  MessageCircle, Phone, Mail, FileText, Activity,
  Clock, RefreshCw, Plus, Check, X,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { WhatsAppComposer } from './whatsapp-composer'
import { logInteraction, getProfileInteractions } from '@/actions/crm'
import type { InteractionType } from '@/app/generated/prisma/enums'

// ── Constants ────────────────────────────────────────────────────────────────

const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'call',        label: 'Llamada' },
  { value: 'note',        label: 'Nota' },
  { value: 'follow_up',  label: 'Seguimiento' },
  { value: 'trial_class', label: 'Clase de prueba' },
  { value: 'email',      label: 'Email' },
]

const INTERACTION_META: Record<string, { Icon: React.ElementType; color: string }> = {
  whatsapp_sent:     { Icon: MessageCircle, color: 'text-green-400' },
  whatsapp_received: { Icon: MessageCircle, color: 'text-teal-400' },
  call:              { Icon: Phone,         color: 'text-blue-400' },
  email:             { Icon: Mail,          color: 'text-violet-400' },
  note:              { Icon: FileText,      color: 'text-slate-400' },
  trial_class:       { Icon: Activity,      color: 'text-amber-400' },
  follow_up:         { Icon: RefreshCw,     color: 'text-orange-400' },
}

const INTERACTION_LABEL: Record<string, string> = {
  whatsapp_sent:     'WhatsApp enviado',
  whatsapp_received: 'WhatsApp recibido',
  call:              'Llamada',
  email:             'Email',
  note:              'Nota',
  trial_class:       'Clase de prueba',
  follow_up:         'Seguimiento',
}

type InteractionRow = {
  id: string
  type: string
  summary: string
  waStatus: string | null
  createdAt: Date
}

interface Props {
  profileId:   string
  profileName: string
  phone:       string | null
  initial:     InteractionRow[]
}

// ── Component ────────────────────────────────────────────────────────────────

export function UserInteractionsPanel({ profileId, profileName, phone, initial }: Props) {
  const [interactions,   setInteractions]   = useState<InteractionRow[]>(initial)
  const [showAddForm,    setShowAddForm]     = useState(false)
  const [newType,        setNewType]         = useState<InteractionType>('note')
  const [newSummary,     setNewSummary]      = useState('')
  const [showWa,         setShowWa]          = useState(false)
  const [isPending,      startTransition]    = useTransition()

  function reload() {
    getProfileInteractions(profileId).then((data) =>
      setInteractions(data as InteractionRow[])
    )
  }

  function handleAdd() {
    if (!newSummary.trim()) return
    startTransition(async () => {
      await logInteraction({ profileId, type: newType, summary: newSummary.trim() })
      setNewSummary('')
      setShowAddForm(false)
      reload()
    })
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Historial CRM
        </h2>
        <div className="flex items-center gap-2">
          {phone && (
            <button
              onClick={() => setShowWa(true)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors font-medium"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </button>
          )}
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> Registrar
          </button>
        </div>
      </div>

      {/* Add interaction form */}
      {showAddForm && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Nueva interacción</p>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as InteractionType)}
            className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-xs"
          >
            {INTERACTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <Textarea
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            placeholder="Descripción de la interacción…"
            rows={2}
            className="text-xs resize-none"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isPending || !newSummary.trim()}
            className="h-7 text-xs"
          >
            <Check className="h-3 w-3 mr-1" /> Guardar
          </Button>
        </div>
      )}

      {/* Timeline */}
      {interactions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sin interacciones registradas</p>
      ) : (
        <div className="relative">
          <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />
          <div className="space-y-4">
            {interactions.map((item) => {
              const meta = INTERACTION_META[item.type] ?? { Icon: Clock, color: 'text-muted-foreground' }
              const { Icon } = meta
              const date = new Date(item.createdAt)
              const daysAgo = Math.floor((Date.now() - date.getTime()) / 86_400_000)
              const timeLabel =
                daysAgo === 0 ? `Hoy ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}`
                : daysAgo === 1 ? 'Ayer'
                : `Hace ${daysAgo} días`

              return (
                <div key={item.id} className="flex gap-3 relative">
                  <div className={`w-7 h-7 rounded-full border bg-background flex items-center justify-center shrink-0 z-10 ${meta.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium">
                        {INTERACTION_LABEL[item.type] ?? item.type}
                      </span>
                      {item.waStatus && (
                        <span className="text-[10px] text-muted-foreground border rounded px-1">{item.waStatus}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto">{timeLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.summary}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showWa && phone && (
        <WhatsAppComposer
          phone={phone}
          name={profileName}
          profileId={profileId}
          onClose={() => { setShowWa(false); reload() }}
        />
      )}
    </div>
  )
}
