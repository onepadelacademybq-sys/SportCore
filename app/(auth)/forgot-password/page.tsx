'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, { error: null })

  if (state.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revisa tu email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>{state.success}</AlertDescription>
          </Alert>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground font-medium hover:underline">
              Volver al inicio de sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/login" className="text-foreground font-medium hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
