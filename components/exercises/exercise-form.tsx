'use client'

import { useActionState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from './tag-input'
import { THEME_OPTIONS } from './theme-badge'
import type { Exercise, ExerciseState, ExerciseTag } from '@/actions/exercises'

const selectClass =
  'w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground ' +
  'focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

const LEVELS = [
  { value: '5ta_masculino', label: '5ta Masculino' },
  { value: '6ta_masculino', label: '6ta Masculino' },
  { value: '7ma_masculino', label: '7ma Masculino' },
  { value: 'femenino_d',    label: 'Femenino D' },
  { value: 'femenino_c',    label: 'Femenino C' },
  { value: 'juvenil_s18',   label: 'Juvenil S18' },
  { value: 'juvenil_s16',   label: 'Juvenil S16' },
  { value: 'juvenil_s14',   label: 'Juvenil S14' },
  { value: 'prejuvenil',    label: 'Prejuvenil (8 a 12 años)' },
  { value: 'baby_padel',    label: 'Baby Pádel (5 a 9 años)' },
]

type FormAction = (prev: ExerciseState, formData: FormData) => Promise<ExerciseState>

interface Props {
  action:   FormAction
  allTags:  ExerciseTag[]
  exercise?: Exercise        // undefined = create mode
}

export function ExerciseForm({ action, allTags, exercise }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  if (state.success) {
    return (
      <Alert className="border-brand/30 bg-brand/10">
        <AlertDescription className="text-brand">{state.success}</AlertDescription>
      </Alert>
    )
  }

  const initialTags = (exercise?.tags ?? []).map((t) => t.name)

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {exercise && <input type="hidden" name="exerciseId" value={exercise.id} />}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del ejercicio</Label>
        <Input
          id="name" name="name" required disabled={isPending}
          defaultValue={exercise?.name}
          placeholder="Ej. Pared lateral en diagonal"
        />
      </div>

      {/* Theme + Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="theme">Temática</Label>
          <select id="theme" name="theme" required disabled={isPending} defaultValue={exercise?.theme ?? 'tecnica'} className={selectClass}>
            {THEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Nivel recomendado</Label>
          <select id="level" name="level" required disabled={isPending} defaultValue={exercise?.level ?? '5ta_masculino'} className={selectClass}>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <Label htmlFor="objective">Objetivo</Label>
        <Textarea
          id="objective" name="objective" required rows={2} disabled={isPending}
          defaultValue={exercise?.objective}
          placeholder="Descripción del propósito del ejercicio"
        />
      </div>

      {/* Duration + Materials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimatedDurationMin">Duración estimada (min)</Label>
          <Input
            id="estimatedDurationMin" name="estimatedDurationMin" type="number"
            min={1} max={180} required disabled={isPending}
            defaultValue={exercise?.estimated_duration_min ?? 15}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="materials">Material necesario</Label>
          <Input
            id="materials" name="materials" disabled={isPending}
            defaultValue={exercise?.materials.join(', ')}
            placeholder="pelotas, conos, palas..."
          />
          <p className="text-xs text-muted-foreground">Separados por coma</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="instructions">Instrucciones paso a paso</Label>
        <Textarea
          id="instructions" name="instructions" rows={5} disabled={isPending}
          defaultValue={exercise?.instructions ?? ''}
          placeholder="1. Coloca los jugadores en posición...\n2. El entrenador lanza la pelota..."
        />
      </div>

      {/* Video + Image URLs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="videoUrl">URL de video (opcional)</Label>
          <Input
            id="videoUrl" name="videoUrl" type="url" disabled={isPending}
            defaultValue={exercise?.video_url ?? ''}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
          <Input
            id="imageUrl" name="imageUrl" type="url" disabled={isPending}
            defaultValue={exercise?.image_url ?? ''}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Etiquetas</Label>
        <TagInput allTags={allTags} initialTags={initialTags} />
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3 pt-1">
        <input
          id="isPublished" name="isPublished" type="checkbox"
          value="true" disabled={isPending}
          defaultChecked={exercise?.is_published ?? false}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        <Label htmlFor="isPublished" className="cursor-pointer">
          Publicar en la biblioteca (visible para todos los entrenadores)
        </Label>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Guardando...' : exercise ? 'Guardar cambios' : 'Crear ejercicio'}
      </Button>
    </form>
  )
}
