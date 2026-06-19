import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MapPin, Phone, Mail, Clock, CalendarCheck } from 'lucide-react'
import { getPublicOrg } from '@/actions/public'
import type { PublicCourt } from '@/actions/public'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const org = await getPublicOrg(slug)
  if (!org) return { title: 'Club no encontrado' }
  return {
    title: org.name,
    description: `Reserva tu ${org.terminology.resource.toLowerCase()} en ${org.name}. Gestión deportiva con SportCore.`,
  }
}

const SPORT_EMOJI: Record<string, string> = {
  padel:    '🎾',
  tenis:    '🎾',
  futbol:   '⚽',
  natacion: '🏊',
  otro:     '🏆',
  general:  '🏆',
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  cancha: 'Cancha',
  campo:  'Campo',
  carril: 'Carril',
  pista:  'Pista',
  sala:   'Sala',
}

function formatTime(t: string | null): string {
  if (!t) return ''
  return t.slice(0, 5)
}

function formatRate(rate: number): string {
  if (!rate) return ''
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(rate)
}

function CourtCard({ court, resourceLabel }: { court: PublicCourt; resourceLabel: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-2">
      <p className="font-semibold">{court.name}</p>
      <p className="text-sm text-muted-foreground">
        {RESOURCE_TYPE_LABELS[court.resource_type] ?? resourceLabel}
        {court.type === 'indoor' ? ' · Cubierta' : ' · Exterior'}
      </p>
      {court.hourly_rate > 0 && (
        <p className="text-sm font-medium text-primary">
          {formatRate(court.hourly_rate)}<span className="text-muted-foreground font-normal">/hora</span>
        </p>
      )}
    </div>
  )
}

export default async function ClubLandingPage({ params }: Props) {
  const { slug } = await params
  const org = await getPublicOrg(slug)

  if (!org) notFound()

  const emoji = SPORT_EMOJI[org.sport] ?? '🏆'
  const { settings } = org

  const open  = formatTime(settings?.opening_time ?? null)
  const close = formatTime(settings?.closing_time ?? null)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-5">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={`${org.name} logo`}
              className="h-16 w-16 rounded-xl object-cover border"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
              {emoji}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-muted-foreground text-sm capitalize mt-0.5">
              {org.sport} · {org.courts.length} {org.terminology.resource.toLowerCase()}
              {org.courts.length !== 1 ? 's' : ''} disponible{org.courts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* ── Espacios ── */}
        {org.courts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              {org.terminology.resource}s disponibles
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {org.courts.map((court) => (
                <CourtCard
                  key={court.id}
                  court={court}
                  resourceLabel={org.terminology.resource}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="rounded-xl border bg-primary/5 p-6 text-center space-y-3">
          <CalendarCheck className="h-8 w-8 mx-auto text-primary" />
          <h2 className="text-lg font-semibold">¿Listo para reservar?</h2>
          <p className="text-sm text-muted-foreground">
            Elige tu {org.terminology.resource.toLowerCase()}, selecciona el horario y confirma en segundos.
          </p>
          {/* Booking page coming in Sprint 3 */}
          <a
            href={`/club/${slug}/book`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <CalendarCheck className="h-4 w-4" />
            Reservar ahora
          </a>
        </section>

        {/* ── Info de contacto ── */}
        {settings && (settings.address || settings.phone || settings.email || open) && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Información</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {open && close && (
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Horario</p>
                    <p className="text-muted-foreground">{open} – {close}</p>
                  </div>
                </div>
              )}
              {settings.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-muted-foreground">{settings.address}</p>
                  </div>
                </div>
              )}
              {settings.phone && (
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <a
                      href={`tel:${settings.phone}`}
                      className="text-primary hover:underline"
                    >
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}
              {settings.email && (
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${settings.email}`}
                      className="text-primary hover:underline"
                    >
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        Powered by{' '}
        <a href="https://sportcore.co" className="font-medium hover:text-foreground transition-colors">
          SportCore
        </a>
        {' '}· un producto de{' '}
        <a href="https://lynkos.id" className="font-medium hover:text-foreground transition-colors">
          Lynkos ID
        </a>
      </footer>
    </div>
  )
}
