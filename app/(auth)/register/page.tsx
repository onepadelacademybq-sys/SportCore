'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerAction, { error: null })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Completa tus datos para unirte a One Padel</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {/* Credenciales */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              required
              disabled={isPending}
            />
          </div>

          {/* Datos personales */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Juan Pérez"
              autoComplete="name"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentId">Número de documento</Label>
            <Input
              id="documentId"
              name="documentId"
              type="text"
              placeholder="DNI / Cédula / Pasaporte"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+34 600 000 000"
              autoComplete="tel"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="Calle, número, ciudad"
              autoComplete="street-address"
              required
              disabled={isPending}
            />
          </div>

          {/* Rol fijo — solo admin puede asignar coach desde el panel */}
          <input type="hidden" name="role" value="player" />

          {/* Aceptación de términos */}
          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              required
              disabled={isPending}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[#00C4CC]"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
              Acepto los{' '}
              <Link href="/terms" target="_blank" className="text-foreground font-medium hover:underline">
                Términos y Condiciones
              </Link>
              {' '}y la{' '}
              <Link href="/privacy" target="_blank" className="text-foreground font-medium hover:underline">
                Política de Privacidad
              </Link>
              {' '}de One Padel Academy
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
