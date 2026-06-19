'use client'

import { useActionState } from 'react'
import { createOrganizationAction } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function OnboardingPage() {
  const [state, action, pending] = useActionState(createOrganizationAction, { error: null })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = document.getElementById('slug') as HTMLInputElement | null
    if (!slugInput || slugInput.dataset.edited === 'true') return
    slugInput.value = e.target.value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            <span className="text-primary">Sport</span>Core
          </h1>
          <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">
            by Lynkos ID
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configura tu organización</CardTitle>
            <CardDescription>
              Estos datos identifican tu academia o club en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-5">
              {state.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la organización</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Mi Academia Deportiva"
                  required
                  onChange={handleNameChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Identificador único (slug)</Label>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="mi-academia"
                  pattern="[a-z0-9-]+"
                  required
                  onInput={() => {
                    const el = document.getElementById('slug') as HTMLInputElement | null
                    if (el) el.dataset.edited = 'true'
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Solo letras minúsculas, números y guiones. Ejemplo: <code>mi-academia</code>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sport">Deporte principal</Label>
                <Select name="sport" required defaultValue="padel">
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Selecciona el deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="padel">Pádel</SelectItem>
                    <SelectItem value="tenis">Tenis</SelectItem>
                    <SelectItem value="futbol">Fútbol</SelectItem>
                    <SelectItem value="natacion">Natación</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? 'Creando organización...' : 'Crear organización y continuar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
