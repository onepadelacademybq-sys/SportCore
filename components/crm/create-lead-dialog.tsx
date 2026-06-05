'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { Button }  from '@/components/ui/button'
import { Input }   from '@/components/ui/input'
import { Label }   from '@/components/ui/label'
import { createLead } from '@/actions/crm'

const SOURCES = [
  { value: 'web_form',  label: 'Formulario web' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'referral',  label: 'Referido' },
  { value: 'walk_in',   label: 'Visita presencial' },
  { value: 'whatsapp',  label: 'WhatsApp entrante' },
  { value: 'other',     label: 'Otro' },
]

interface Props { onClose: () => void }

export function CreateLeadDialog({ onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await createLead({
          name:     fd.get('name') as string,
          phone:    fd.get('phone') as string,
          whatsapp: (fd.get('whatsapp') as string) || undefined,
          email:    (fd.get('email') as string) || undefined,
          source:   fd.get('source') as Parameters<typeof createLead>[0]['source'],
          sport:    (fd.get('sport') as string) || undefined,
          notes:    (fd.get('notes') as string) || undefined,
        })
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al crear prospecto')
      }
    })
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold">Nuevo prospecto</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input id="name" name="name" required placeholder="María García" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input id="phone" name="phone" required placeholder="3001234567" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" name="whatsapp" placeholder="Si es diferente" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" name="email" type="email" placeholder="maria@email.com" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">¿Cómo nos encontró?</Label>
                <select
                  id="source"
                  name="source"
                  defaultValue="web_form"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sport">Deporte / disciplina</Label>
                <Input id="sport" name="sport" placeholder="Pilates, Padel…" />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" name="notes" placeholder="Interesada en horario nocturno…" />
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Guardando…' : 'Crear prospecto'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Se enviará un WhatsApp de bienvenida automáticamente si tiene número registrado
            </p>
          </form>
        </div>
      </div>
    </>
  )
}
