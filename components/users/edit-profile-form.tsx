'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionState } from '@/actions/users'

interface Props {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  initialValues: {
    full_name:     string
    phone:         string | null
    address:       string | null
    document_id?:  string | null
    date_of_birth?: string | null
  }
  targetId?: string
}

export function EditProfileForm({ action, initialValues, targetId }: Props) {
  const [state, formAction, isPending] = useActionState(action, { error: null })

  const showDocFields =
    initialValues.document_id  == null ||
    initialValues.date_of_birth == null

  return (
    <form action={formAction} className="space-y-4">
      {targetId && <input type="hidden" name="targetId" value={targetId} />}

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      {state.success && (
        <Alert>
          <AlertDescription className="text-[#00C4CC]">{state.success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={`full_name${targetId ?? ''}`}>Nombre completo</Label>
        <Input
          id={`full_name${targetId ?? ''}`}
          name="full_name"
          defaultValue={initialValues.full_name}
          disabled={isPending}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`phone${targetId ?? ''}`}>Teléfono</Label>
        <Input
          id={`phone${targetId ?? ''}`}
          name="phone"
          type="tel"
          defaultValue={initialValues.phone ?? ''}
          placeholder="+57 300 000 0000"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`address${targetId ?? ''}`}>Dirección</Label>
        <Input
          id={`address${targetId ?? ''}`}
          name="address"
          defaultValue={initialValues.address ?? ''}
          placeholder="Calle, número, ciudad"
          disabled={isPending}
        />
      </div>

      {/* Campos de primera configuración — solo visibles mientras estén vacíos */}
      {showDocFields && (
        <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            Estos datos solo pueden configurarse una vez. Contacta al administrador para modificarlos.
          </p>
          {initialValues.document_id == null && (
            <div className="space-y-2">
              <Label htmlFor={`document_id${targetId ?? ''}`}>Número de documento</Label>
              <Input
                id={`document_id${targetId ?? ''}`}
                name="document_id"
                placeholder="DNI / Cédula / Pasaporte"
                disabled={isPending}
              />
            </div>
          )}
          {initialValues.date_of_birth == null && (
            <div className="space-y-2">
              <Label htmlFor={`date_of_birth${targetId ?? ''}`}>Fecha de nacimiento</Label>
              <Input
                id={`date_of_birth${targetId ?? ''}`}
                name="date_of_birth"
                type="date"
                disabled={isPending}
              />
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
