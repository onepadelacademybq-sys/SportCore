'use client'

import { useActionState } from 'react'
import { updateGeneralSettingsAction, type SettingsState, type AcademySettingsData } from '@/actions/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const initial: SettingsState = { error: null }

export function GeneralSettingsForm({ data }: { data: AcademySettingsData }) {
  const [state, action, pending] = useActionState(updateGeneralSettingsAction, initial)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información general</CardTitle>
        <CardDescription>Nombre, contacto e imagen de tu academia.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la academia</Label>
              <Input id="name" name="name" defaultValue={data.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de contacto</Label>
              <Input id="email" name="email" type="email" defaultValue={data.email ?? ''} placeholder="contacto@miacademia.co" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" defaultValue={data.phone ?? ''} placeholder="+57 300 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" defaultValue={data.address ?? ''} placeholder="Calle 123 # 45-67, Bogotá" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL del logo</Label>
            <Input id="logoUrl" name="logoUrl" type="url" defaultValue={data.logoUrl ?? ''} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">
              URL pública de la imagen. Recomendado: 200×200 px, fondo transparente.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              URL pública:{' '}
              <code className="bg-muted px-1 py-0.5 rounded">{data.slug}.sportcore.co</code>
            </div>
            {state.error && (
              <Alert variant="destructive" className="py-2 px-3 max-w-xs">
                <AlertDescription className="text-xs">{state.error}</AlertDescription>
              </Alert>
            )}
            {state.success && (
              <p className="text-xs text-emerald-400">{state.success}</p>
            )}
            <Button type="submit" disabled={pending} size="sm">
              {pending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
