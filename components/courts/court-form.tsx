'use client'

import { useActionState, useEffect } from 'react'
import { createCourtAction, updateCourtAction, type Court, type CourtActionState } from '@/actions/courts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CourtFormProps {
  court?: Court
  onSuccess?: () => void
}

export function CourtForm({ court, onSuccess }: CourtFormProps) {
  const action = court ? updateCourtAction : createCourtAction
  const [state, formAction, pending] = useActionState<CourtActionState, FormData>(
    action,
    { error: null },
  )

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  return (
    <form action={formAction} className="space-y-4">
      {court && <input type="hidden" name="id" value={court.id} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nombre del espacio</Label>
        <Input
          id="name"
          name="name"
          defaultValue={court?.name}
          placeholder="Ej: Cancha 1, Campo Norte, Carril A"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="resourceType">Tipo</Label>
          <Select name="resourceType" defaultValue={court?.resource_type ?? 'cancha'}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cancha">Cancha</SelectItem>
              <SelectItem value="campo">Campo</SelectItem>
              <SelectItem value="carril">Carril</SelectItem>
              <SelectItem value="pista">Pista</SelectItem>
              <SelectItem value="sala">Sala</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Modalidad</Label>
          <Select name="type" defaultValue={court?.type ?? 'indoor'}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="indoor">Cubierta</SelectItem>
              <SelectItem value="outdoor">Exterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="surface">Superficie</Label>
          <Select name="surface" defaultValue={court?.surface ?? 'moqueta'}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moqueta">Moqueta</SelectItem>
              <SelectItem value="cesped_artificial">Césped artificial</SelectItem>
              <SelectItem value="cristal">Cristal</SelectItem>
              <SelectItem value="hormigon">Hormigón</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Tarifa / hora (COP)</Label>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min="0"
            step="1000"
            defaultValue={court?.hourly_rate ?? 0}
            placeholder="70000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={court?.notes ?? ''}
          placeholder="Características especiales, restricciones, etc."
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? (court ? 'Guardando...' : 'Creando...')
          : (court ? 'Guardar cambios' : 'Crear espacio')}
      </Button>
    </form>
  )
}
