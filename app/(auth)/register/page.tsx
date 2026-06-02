'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

function calcAge(dob: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const today = new Date()
  const age = today.getFullYear() - d.getFullYear()
  const hadBirthday =
    today.getMonth() > d.getMonth() ||
    (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate())
  return age - (hadBirthday ? 0 : 1)
}

export default function RegisterPage() {
  const [state, action, isPending] = useActionState(registerAction, { error: null })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [guardianConsent, setGuardianConsent] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState('')

  const age = calcAge(dateOfBirth)
  const isMinor = age !== null && age < 18

  const canSubmit = !isPending && termsAccepted && (!isMinor || guardianConsent)

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
              placeholder="+57 300 000 0000"
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
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
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

          {/* Sección de representante legal — solo para menores */}
          {isMinor && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-300">Este jugador es menor de edad</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Se requieren los datos del representante legal para completar el registro.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="guardianName">Nombre completo del representante</Label>
                  <Input
                    id="guardianName"
                    name="guardianName"
                    type="text"
                    placeholder="Nombre del padre/madre/tutor"
                    required
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianDocument">Documento del representante</Label>
                  <Input
                    id="guardianDocument"
                    name="guardianDocument"
                    type="text"
                    placeholder="Cédula o documento de identidad"
                    required
                    disabled={isPending}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="guardianPhone">Teléfono</Label>
                    <Input
                      id="guardianPhone"
                      name="guardianPhone"
                      type="tel"
                      placeholder="+57 300 000 0000"
                      required
                      disabled={isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianEmail">Email</Label>
                    <Input
                      id="guardianEmail"
                      name="guardianEmail"
                      type="email"
                      placeholder="representante@email.com"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guardianRelationship">Relación con el menor</Label>
                  <select
                    id="guardianRelationship"
                    name="guardianRelationship"
                    required
                    disabled={isPending}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="padre">Padre</option>
                    <option value="madre">Madre</option>
                    <option value="tutor_legal">Tutor legal</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {/* Consentimiento parental */}
                <div className="flex items-start gap-3 pt-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <input
                    type="checkbox"
                    id="guardianConsent"
                    name="guardianConsent"
                    required
                    checked={guardianConsent}
                    onChange={(e) => setGuardianConsent(e.target.checked)}
                    disabled={isPending}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[#00C4CC] cursor-pointer"
                  />
                  <label htmlFor="guardianConsent" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                    Como representante legal, autorizo el tratamiento de los datos personales
                    de mi hijo/a o representado/a de acuerdo con la{' '}
                    <strong className="text-foreground">Ley 1581 de 2012</strong> de protección
                    de datos personales de Colombia y la{' '}
                    <Link href="/privacy" target="_blank" className="text-foreground font-medium hover:underline">
                      Política de Privacidad
                    </Link>{' '}
                    de One Padel Academy.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Rol fijo */}
          <input type="hidden" name="role" value="player" />

          {/* Aceptación de términos */}
          <div className="flex items-start gap-3 pt-1 rounded-lg border border-border bg-muted/20 p-3">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isPending}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-[#00C4CC] cursor-pointer"
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
              {' '}de One Padel Academy
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
