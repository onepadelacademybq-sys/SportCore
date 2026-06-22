'use client'

import React, { useState } from 'react'
import { useActionState } from 'react'
import { createOrganizationAction } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Check, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const SPORTS = [
  { key: 'padel',      label: 'Pádel',        emoji: '🏓', desc: 'Canchas, clases y reservas de pádel' },
  { key: 'tenis',      label: 'Tenis',         emoji: '🎾', desc: 'Canchas, programas y rankings' },
  { key: 'futbol',     label: 'Fútbol',        emoji: '⚽', desc: 'Campos, equipos y temporadas' },
  { key: 'natacion',   label: 'Natación',      emoji: '🏊', desc: 'Carriles, grupos y competencias' },
  { key: 'baloncesto', label: 'Baloncesto',    emoji: '🏀', desc: 'Canchas, equipos y ligas' },
  { key: 'otro',       label: 'Otro deporte',  emoji: '🏆', desc: 'Cualquier disciplina deportiva' },
] as const

type WizardSport = (typeof SPORTS)[number]['key']

const STEP_LABELS = ['Tu deporte', 'Tu organización', 'Confirmar']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                i + 1 < current
                  ? 'bg-primary text-primary-foreground'
                  : i + 1 === current
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1 < current ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs hidden sm:block',
                i + 1 === current ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
          {i < STEP_LABELS.length - 1 && (
            <div
              className={cn(
                'h-px w-10 mb-4 transition-colors',
                i + 1 < current ? 'bg-primary' : 'bg-border',
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, { error: null })

  const [step, setStep]               = useState(1)
  const [sport, setSport]             = useState<WizardSport | null>(null)
  const [name, setName]               = useState('')
  const [slug, setSlug]               = useState('')
  const [slugEdited, setSlugEdited]   = useState(false)

  function toSlug(val: string) {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setName(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  const selectedSport = SPORTS.find((s) => s.key === sport)
  const slugValid     = /^[a-z0-9-]+$/.test(slug) && slug.length >= 2
  const nameValid     = name.trim().length >= 2

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-8">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            <span className="text-primary">Sport</span>Core
          </h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">
            by Lynkos ID
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ── Step 1 — Sport selection ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">¿Cuál es tu deporte?</h2>
              <p className="text-sm text-muted-foreground">
                Configuramos tu plataforma con la terminología y ejercicios de tu disciplina.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSport(s.key)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all cursor-pointer',
                    'hover:border-primary/50 hover:bg-primary/5',
                    sport === s.key
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                      : 'border-border bg-card',
                  )}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="text-sm font-medium leading-tight">{s.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight hidden sm:block">
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={!sport}
              onClick={() => setStep(2)}
            >
              Continuar <ChevronRight className="size-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2 — Org name + slug ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">Configura tu organización</h2>
              <p className="text-sm text-muted-foreground">
                Estos datos identifican tu academia o club en la plataforma.
              </p>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-card p-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la organización</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Mi Academia Deportiva"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Identificador único</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value)
                    setSlugEdited(true)
                  }}
                  placeholder="mi-academia"
                  pattern="[a-z0-9-]+"
                />
                <p className="text-xs text-muted-foreground">
                  Tu URL pública:{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    {slug || 'mi-academia'}.sportcore.co
                  </code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                <ChevronLeft className="size-4" /> Atrás
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={!nameValid || !slugValid}
                onClick={() => setStep(3)}
              >
                Continuar <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3 — Confirmation + submit ───────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-semibold">Todo listo</h2>
              <p className="text-sm text-muted-foreground">
                Revisa los datos y crea tu organización.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
              {/* Sport row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <span className="text-3xl">{selectedSport?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Deporte</p>
                  <p className="font-medium">{selectedSport?.label}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Cambiar
                </button>
              </div>

              {/* Org row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Organización</p>
                  <p className="font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground truncate">{slug}.sportcore.co</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Cambiar
                </button>
              </div>

              {/* Plan row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">PRO</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="font-medium">Pro — 30 días de prueba gratis</p>
                </div>
              </div>
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <form action={formAction} className="space-y-0">
              <input type="hidden" name="sport" value={sport ?? ''} />
              <input type="hidden" name="name"  value={name} />
              <input type="hidden" name="slug"  value={slug} />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                  disabled={pending}
                >
                  <ChevronLeft className="size-4" /> Atrás
                </Button>
                <Button type="submit" className="flex-1" disabled={pending}>
                  {pending ? 'Creando organización...' : 'Crear organización →'}
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
