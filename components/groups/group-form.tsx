'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScheduleBuilder } from './schedule-builder'
import type { TrainingGroup, GroupActionState } from '@/actions/groups'
import type { CoachOption, CourtOption } from '@/actions/bookings'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

type FormAction = (prev: GroupActionState, formData: FormData) => Promise<GroupActionState>

interface Props {
  action: FormAction
  coaches: CoachOption[]
  courts: CourtOption[]
  group?: TrainingGroup   // undefined = create mode
}

export function GroupForm({ action, coaches, courts, group }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  if (state.success) {
    return (
      <Alert className="border-[#00C4CC]/30 bg-[#00C4CC]/10">
        <AlertDescription className="text-[#00C4CC]">{state.success}</AlertDescription>
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

      {/* Hidden fields for edit mode */}
      {group && <input type="hidden" name="groupId" value={group.id} />}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del grupo</Label>
        <Input
          id="name"
          name="name"
          required
          disabled={isPending}
          defaultValue={group?.name}
          placeholder="Ej. Grupo Avanzado Mañana"
        />
      </div>

      {/* Coach */}
      <div className="space-y-2">
        <Label htmlFor="coachId">Entrenador</Label>
        <select id="coachId" name="coachId" required disabled={isPending} defaultValue={group?.coach_id ?? ''} className={selectClass}>
          <option value="">Selecciona un entrenador...</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}</option>
          ))}
        </select>
      </div>

      {/* Level + capacity row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="level">Nivel</Label>
          <select id="level" name="level" required disabled={isPending} defaultValue={group?.level ?? '5ta_masculino'} className={selectClass}>
            <option value="5ta_masculino">5ta Masculino</option>
            <option value="6ta_masculino">6ta Masculino</option>
            <option value="7ma_masculino">7ma Masculino</option>
            <option value="femenino_d">Femenino D</option>
            <option value="femenino_c">Femenino C</option>
            <option value="juvenil_s18">Juvenil S18</option>
            <option value="juvenil_s16">Juvenil S16</option>
            <option value="juvenil_s14">Juvenil S14</option>
            <option value="prejuvenil">Prejuvenil (8 a 12 años)</option>
            <option value="baby_padel">Baby Pádel (5 a 9 años)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxCapacity">Cupo máximo</Label>
          <Input
            id="maxCapacity"
            name="maxCapacity"
            type="number"
            min={1}
            max={30}
            required
            disabled={isPending}
            defaultValue={group?.max_capacity ?? 8}
          />
        </div>
      </div>

      {/* Fee + status row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyFee">Tarifa mensual ($)</Label>
          <Input
            id="monthlyFee"
            name="monthlyFee"
            type="number"
            min={0}
            step="0.01"
            required
            disabled={isPending}
            defaultValue={group?.monthly_fee ?? 0}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <select id="status" name="status" disabled={isPending} defaultValue={group?.status ?? 'active'} className={selectClass}>
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>
      </div>

      {/* Default court (optional) */}
      <div className="space-y-2">
        <Label htmlFor="defaultCourtId">Cancha por defecto (opcional)</Label>
        <select id="defaultCourtId" name="defaultCourtId" disabled={isPending} defaultValue={group?.default_court_id ?? ''} className={selectClass}>
          <option value="">Sin cancha asignada</option>
          {courts.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
          ))}
        </select>
      </div>

      {/* Schedules */}
      <div className="space-y-2">
        <Label>Horarios recurrentes</Label>
        <ScheduleBuilder initialSchedules={group?.schedules} />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          disabled={isPending}
          defaultValue={group?.notes ?? ''}
          placeholder="Descripción, requisitos, etc."
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Guardando...' : group ? 'Guardar cambios' : 'Crear grupo'}
      </Button>
    </form>
  )
}
