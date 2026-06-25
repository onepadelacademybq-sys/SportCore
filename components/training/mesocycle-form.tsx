'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TrainingState } from '@/actions/training'
import { MESOCYCLE_TEMPLATES } from '@/lib/planning-templates'
import { PADEL_LEVELS, PADEL_LEVEL_LABELS } from '@/lib/constants'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

const LEVELS = PADEL_LEVELS.map((value) => ({ value, label: PADEL_LEVEL_LABELS[value] }))

type FormAction = (prev: TrainingState, formData: FormData) => Promise<TrainingState>

interface Props {
  action: FormAction
  defaultValues?: {
    name?: string
    generalObjective?: string
    level?: string
    durationWeeks?: number
    startDate?: string
    status?: string
  }
  mesocycleId?: string
  playerId?: string
  groupId?: string
  macrocycleId?: string
  targetLabel?: string
}

export function MesocycleForm({ action, defaultValues, mesocycleId, playerId, groupId, macrocycleId, targetLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [objective, setObjective] = useState(defaultValues?.generalObjective ?? '')
  const [durationWeeks, setDurationWeeks] = useState(defaultValues?.durationWeeks ?? 4)
  const [level, setLevel] = useState(defaultValues?.level ?? '5ta_masculino')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(!mesocycleId)

  function applyTemplate(templateId: string) {
    const t = MESOCYCLE_TEMPLATES.find((t) => t.id === templateId)
    if (!t) return
    setSelectedTemplate(templateId)
    setName(t.name)
    setObjective(t.generalObjective)
    setDurationWeeks(t.durationWeeks)
    setShowTemplates(false)
  }

  if (state.success) {
    return (
      <Alert className="border-brand/30 bg-brand/10">
        <AlertDescription className="text-brand">{state.success}</AlertDescription>
      </Alert>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {mesocycleId && <input type="hidden" name="mesocycleId" value={mesocycleId} />}
      {playerId && <input type="hidden" name="playerId" value={playerId} />}
      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      {macrocycleId && <input type="hidden" name="macrocycleId" value={macrocycleId} />}

      {targetLabel && (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Asignado a: </span>
          <span className="font-medium">{targetLabel}</span>
        </div>
      )}

      {/* Template picker — only shown when creating */}
      {!mesocycleId && (
        <div className="rounded-lg border border-dashed border-border">
          <button
            type="button"
            onClick={() => setShowTemplates((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
          >
            <span>
              {selectedTemplate
                ? `Plantilla: ${MESOCYCLE_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}`
                : 'Elegir plantilla predefinida (opcional)'}
            </span>
            <span className="text-muted-foreground">{showTemplates ? '▲' : '▼'}</span>
          </button>
          {showTemplates && (
            <div className="border-t border-border px-4 py-3 grid grid-cols-1 gap-2 max-h-72 overflow-y-auto">
              {MESOCYCLE_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border transition-colors text-sm ${
                    selectedTemplate === t.id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {t.durationWeeks} semanas · {t.totalSessions} sesiones · {t.generalObjective}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del mesociclo</Label>
        <Input
          id="name" name="name" required disabled={isPending}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Pretemporada Verano 2025"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="generalObjective">Objetivo general</Label>
        <Textarea
          id="generalObjective" name="generalObjective" required rows={2} disabled={isPending}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Foco principal del período (físico, técnico, táctico…)"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="level">Nivel del grupo</Label>
          <select
            id="level" name="level" required disabled={isPending}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={selectClass}
          >
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationWeeks">Duración (semanas)</Label>
          <Input
            id="durationWeeks" name="durationWeeks" type="number"
            min={1} max={52} required disabled={isPending}
            value={durationWeeks}
            onChange={(e) => setDurationWeeks(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Fecha de inicio (opcional)</Label>
        <Input
          id="startDate" name="startDate" type="date" disabled={isPending}
          defaultValue={defaultValues?.startDate ?? ''}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Guardando...' : mesocycleId ? 'Guardar cambios' : 'Crear mesociclo'}
      </Button>
    </form>
  )
}
