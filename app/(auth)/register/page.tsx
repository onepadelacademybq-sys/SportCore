'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff } from 'lucide-react'

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length < 8)  return { level: 0, label: '',        color: '' }
  let score = 0
  if (pw.length >= 12)         score++
  if (/[A-Z]/.test(pw))        score++
  if (/[0-9]/.test(pw))        score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: 'Débil',   color: 'bg-rose-500' }
  if (score <= 2) return { level: 2, label: 'Regular', color: 'bg-amber-400' }
  return              { level: 3, label: 'Fuerte',  color: 'bg-emerald-500' }
}

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerAction, { error: null })

  const [termsAccepted,   setTermsAccepted]   = useState(false)
  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showPwC,         setShowPwC]         = useState(false)

  const strength     = passwordStrength(password)
  const mismatch     = passwordConfirm.length > 0 && password !== passwordConfirm
  const canSubmit    = !isPending && termsAccepted && !mismatch && password.length >= 8

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
        <CardDescription>Crea tu cuenta — los datos adicionales los completas desde tu perfil</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Barra de fortaleza */}
            {password.length > 0 && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex gap-1 flex-1">
                  {([1, 2, 3] as const).map(l => (
                    <div
                      key={l}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        strength.level >= l ? strength.color : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <span className="text-[11px] text-muted-foreground w-12 text-right">{strength.label}</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type={showPwC ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                required
                disabled={isPending}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className={`pr-10 ${mismatch ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPwC(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPwC ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mismatch && (
              <p className="text-[11px] text-rose-500">Las contraseñas no coinciden</p>
            )}
          </div>

          <input type="hidden" name="role" value="player" />

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isPending}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-brand cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
              He leído y acepto los{' '}
              <Link href="/terms" target="_blank" className="text-foreground font-medium hover:underline">
                Términos y Condiciones
              </Link>
              {' '}y la{' '}
              <Link href="/privacy" target="_blank" className="text-foreground font-medium hover:underline">
                Política de Privacidad
              </Link>
              {' '}de SportCore
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
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
