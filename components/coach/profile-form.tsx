'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateCoachProfile } from '@/actions/coach-profile'
import type { CoachProfileFull } from '@/actions/coach-profile'
import { COACH_STRENGTHS, COACH_LANGUAGES, PADEL_LEVELS } from '@/lib/coach-constants'
import { Button } from '@/components/ui/button'

function CheckItem({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string
  value: string
  label: string
  defaultChecked: boolean
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border accent-brand"
      />
      <span className="text-sm">{label}</span>
    </label>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export function ProfileForm({ profile }: { profile: CoachProfileFull }) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(updateCoachProfile, { error: null })

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-emerald-500 bg-emerald-500/10 rounded-md px-3 py-2">{state.success}</p>
      )}

      {/* Datos personales */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Datos personales</h3>
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Nombre completo">
            <input
              name="full_name"
              defaultValue={profile.full_name}
              required
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            />
          </FieldGroup>
          <FieldGroup label="Teléfono">
            <input
              name="phone"
              defaultValue={profile.phone ?? ''}
              placeholder="+57 300 000 0000"
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Bio">
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            rows={3}
            placeholder="Describe tu experiencia y enfoque como entrenador…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
          />
        </FieldGroup>

        <FieldGroup label="Años de experiencia">
          <input
            type="number"
            name="years_experience"
            defaultValue={profile.years_experience}
            min={0}
            max={60}
            className="h-9 w-24 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          />
        </FieldGroup>
      </div>

      {/* Fortalezas */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Fortalezas como entrenador</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COACH_STRENGTHS.map((s) => (
            <CheckItem
              key={s.value}
              name="specialties"
              value={s.value}
              label={s.label}
              defaultChecked={profile.specialties.includes(s.value)}
            />
          ))}
        </div>
      </div>

      {/* Niveles preferidos */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Niveles con los que trabaja mejor</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PADEL_LEVELS.map((l) => (
            <CheckItem
              key={l.value}
              name="preferred_levels"
              value={l.value}
              label={l.label}
              defaultChecked={profile.preferred_levels.includes(l.value)}
            />
          ))}
        </div>
      </div>

      {/* Estilo de entrenamiento */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Estilo de entrenamiento</h3>
        <textarea
          name="training_style"
          defaultValue={profile.training_style ?? ''}
          rows={4}
          placeholder="Describe tu metodología, filosofía y estilo de trabajo con los jugadores…"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground resize-none"
        />
      </div>

      {/* Idiomas */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-semibold">Idiomas de entrenamiento</h3>
        <div className="flex flex-wrap gap-3">
          {COACH_LANGUAGES.map((l) => (
            <CheckItem
              key={l.value}
              name="languages"
              value={l.value}
              label={l.label}
              defaultChecked={profile.languages.includes(l.value)}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
