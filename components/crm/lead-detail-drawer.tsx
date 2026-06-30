'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  X, MessageCircle, Phone, Mail, FileText, Activity,
  Clock, ChevronRight, RefreshCw, Plus, Check, AlertTriangle,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import { WhatsAppComposer } from './whatsapp-composer'
import {
  updateLeadStatus,
  updateLead,
  getLeadInteractions,
  logInteraction,
} from '@/actions/crm'
import type { LeadWithInteraction } from '@/app/(dashboard)/admin/crm/page'
import type { InteractionType } from '@/app/generated/prisma/enums'

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  new:             { label: 'Nuevo',          dot: 'bg-slate-400',  badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  contacted:       { label: 'Contactado',     dot: 'bg-blue-400',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  trial_scheduled: { label: 'Clase agendada', dot: 'bg-violet-400', badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  trial_done:      { label: 'Clase hecha',    dot: 'bg-amber-400',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  converted:       { label: 'Convertido',     dot: 'bg-green-400',  badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
  lost:            { label: 'Perdido',        dot: 'bg-red-400',    badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const NEXT_STATUS: Record<string, string> = {
  new:             'contacted',
  contacted:       'trial_scheduled',
  trial_scheduled: 'trial_done',
  trial_done:      'converted',
}

const SOURCE_LABEL: Record<string, string> = {
  web_form:  'Web',
  instagram: 'Instagram',
  facebook:  'Facebook',
  referral:  'Referido',
  walk_in:   'Presencial',
  whatsapp:  'WhatsApp',
  other:     'Otro',
}

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

// ── Types ────────────────────────────────────────────────────────────────────

type Interaction = {
  id: string
  type: string
  summary: string
  waStatus: string | null
  createdAt: Date
}

interface Props {
  lead: LeadWithInteraction
  onClose: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export function LeadDetailDrawer({ lead: initialLead, onClose }: Props) {
  const [tab, setTab] = useState<'info' | 'historial'>('historial')

  // Lead state (updates after saves)
  const [lead, setLead] = useState(initialLead)

  // Interactions
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Info edit form
  const [editName,     setEditName]     = useState(lead.name)
  const [editPhone,    setEditPhone]    = useState(lead.phone)
  const [editWhatsapp, setEditWhatsapp] = useState(lead.whatsapp ?? '')
  const [editEmail,    setEditEmail]    = useState(lead.email ?? '')
  const [editSport,    setEditSport]    = useState(lead.sport ?? '')
  const [editNotes,    setEditNotes]    = useState(lead.notes ?? '')
  const [saveOk,       setSaveOk]       = useState(false)

  // Mark as lost
  const [showLostForm, setShowLostForm] = useState(false)
  const [lostReason,   setLostReason]   = useState('')

  // Add interaction
  const [showAddForm,      setShowAddForm]      = useState(false)
  const [newType,          setNewType]          = useState<InteractionType>('note')
  const [newSummary,       setNewSummary]       = useState('')

  // WhatsApp composer
  const [showWa, setShowWa] = useState(false)

  const [isPending, startTransition] = useTransition()

  // ── Load interactions ─────────────────────────────────────────────────────

  function loadInteractions() {
    setLoadingHistory(true)
    getLeadInteractions(lead.id).then((data) => {
      setInteractions(data as Interaction[])
      setLoadingHistory(false)
    })
  }

  useEffect(() => { loadInteractions() }, [lead.id])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSaveInfo() {
    startTransition(async () => {
      await updateLead(lead.id, {
        name:     editName,
        phone:    editPhone,
        whatsapp: editWhatsapp || null,
        email:    editEmail    || null,
        sport:    editSport    || null,
        notes:    editNotes    || null,
      })
      setLead((prev) => ({
        ...prev,
        name:     editName,
        phone:    editPhone,
        whatsapp: editWhatsapp || null,
        email:    editEmail    || null,
        sport:    editSport    || null,
        notes:    editNotes    || null,
      }))
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2000)
    })
  }

  function handleAdvance() {
    const next = NEXT_STATUS[lead.status]
    if (!next) return
    startTransition(async () => {
      await updateLeadStatus(lead.id, next as Parameters<typeof updateLeadStatus>[1])
      setLead((prev) => ({ ...prev, status: next as typeof prev.status }))
      loadInteractions()
    })
  }

  function handleMarkLost() {
    if (!lostReason.trim()) return
    startTransition(async () => {
      await updateLeadStatus(lead.id, 'lost', { lostReason: lostReason.trim() })
      setLead((prev) => ({ ...prev, status: 'lost', lostReason: lostReason.trim() }))
      setShowLostForm(false)
      setLostReason('')
      loadInteractions()
    })
  }

  function handleAddInteraction() {
    if (!newSummary.trim()) return
    startTransition(async () => {
      await logInteraction({ leadId: lead.id, type: newType, summary: newSummary.trim() })
      setNewSummary('')
      setShowAddForm(false)
      loadInteractions()
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const statusMeta  = STATUS_META[lead.status]
  const nextStatus  = NEXT_STATUS[lead.status]
  const canMarkLost = lead.status !== 'converted' && lead.status !== 'lost'

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[480px] bg-card border-l shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-5 py-4 border-b shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-base truncate">{lead.name}</h2>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {SOURCE_LABEL[lead.source] ?? lead.source}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dot}`} />
              <span className={`text-xs font-medium ${statusMeta.badge.split(' ')[1]}`}>
                {statusMeta.label}
              </span>
              {lead.lostReason && (
                <span className="text-xs text-muted-foreground truncate">— {lead.lostReason}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30 shrink-0 flex-wrap">
          {nextStatus && (
            <button
              onClick={handleAdvance}
              disabled={isPending}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              Avanzar a {STATUS_META[nextStatus].label}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
          {canMarkLost && (
            <button
              onClick={() => setShowLostForm((v) => !v)}
              disabled={isPending}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
            >
              <AlertTriangle className="h-3 w-3" /> Marcar como perdido
            </button>
          )}
          <button
            onClick={() => setShowWa(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors font-medium ml-auto"
          >
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </button>
        </div>

        {/* ── Mark as lost form ── */}
        {showLostForm && (
          <div className="px-5 py-3 border-b bg-red-500/5 shrink-0">
            <p className="text-xs font-medium text-red-400 mb-2">Motivo de pérdida</p>
            <div className="flex gap-2">
              <Input
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Ej: Precio, ya tomó clases en otro lugar…"
                className="text-xs h-8"
                onKeyDown={(e) => e.key === 'Enter' && handleMarkLost()}
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleMarkLost}
                disabled={isPending || !lostReason.trim()}
                className="h-8 px-3 text-xs shrink-0"
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-0 border-b shrink-0">
          {([
            { id: 'historial', label: 'Historial' },
            { id: 'info',      label: 'Información' },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content (scrollable) ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Historial tab ── */}
          {tab === 'historial' && (
            <div className="p-5 space-y-4">

              {/* Add interaction */}
              <div>
                {!showAddForm ? (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Registrar interacción
                  </button>
                ) : (
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
                      onClick={handleAddInteraction}
                      disabled={isPending || !newSummary.trim()}
                      className="h-7 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" /> Guardar
                    </Button>
                  </div>
                )}
              </div>

              {/* Timeline */}
              {loadingHistory ? (
                <div className="text-xs text-muted-foreground text-center py-8">Cargando historial…</div>
              ) : interactions.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-8">Sin interacciones registradas</div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-4">
                    {interactions.map((item) => {
                      const meta = INTERACTION_META[item.type] ?? { Icon: Clock, color: 'text-muted-foreground' }
                      const { Icon } = meta
                      const date = new Date(item.createdAt)
                      const daysAgo = Math.floor((Date.now() - date.getTime()) / 86_400_000)
                      const timeLabel = daysAgo === 0
                        ? `Hoy ${date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}`
                        : daysAgo === 1
                        ? 'Ayer'
                        : `Hace ${daysAgo} días`

                      return (
                        <div key={item.id} className="flex gap-3 relative">
                          {/* Icon dot */}
                          <div className={`w-7 h-7 rounded-full border bg-background flex items-center justify-center shrink-0 z-10 ${meta.color}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium">
                                {INTERACTION_LABEL[item.type] ?? item.type}
                              </span>
                              {item.waStatus && (
                                <span className="text-[10px] text-muted-foreground border rounded px-1">
                                  {item.waStatus}
                                </span>
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
            </div>
          )}

          {/* ── Info tab ── */}
          {tab === 'info' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Nombre completo</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">WhatsApp</Label>
                  <Input
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="Si es diferente"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Correo electrónico</Label>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Deporte / disciplina</Label>
                  <Input
                    value={editSport}
                    onChange={(e) => setEditSport(e.target.value)}
                    placeholder="Pilates, Pádel…"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Notas</Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="text-sm resize-none"
                    placeholder="Observaciones sobre el prospecto…"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveInfo}
                disabled={isPending}
                size="sm"
                className="w-full"
              >
                {saveOk ? (
                  <><Check className="h-3.5 w-3.5 mr-1.5" /> Guardado</>
                ) : isPending ? (
                  'Guardando…'
                ) : (
                  'Guardar cambios'
                )}
              </Button>

              {/* Read-only metadata */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Fuente</span>
                  <span className="text-foreground">{SOURCE_LABEL[lead.source] ?? lead.source}</span>
                </div>
                <div className="flex justify-between">
                  <span>Creado</span>
                  <span className="text-foreground">
                    {new Date(lead.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })}
                  </span>
                </div>
                {lead.convertedAt && (
                  <div className="flex justify-between">
                    <span>Convertido</span>
                    <span className="text-green-400">
                      {new Date(lead.convertedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp composer */}
      {showWa && (
        <WhatsAppComposer
          phone={lead.whatsapp ?? lead.phone}
          name={lead.name}
          leadId={lead.id}
          onClose={() => { setShowWa(false); loadInteractions() }}
        />
      )}
    </>
  )
}
