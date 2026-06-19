import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getPublicOrg, getPublicSlots } from '@/actions/public'
import { BookingFilterForm } from '@/components/club/booking-filter-form'
import { BookingSlotForm } from '@/components/club/booking-slot-form'

interface Props {
  params:      Promise<{ slug: string }>
  searchParams: Promise<{ court?: string; date?: string }>
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params
  const org = await getPublicOrg(slug)
  if (!org) return { title: 'Reservar' }
  return {
    title: `Reservar en ${org.name}`,
    description: `Elige tu horario y solicita una reserva en ${org.name}.`,
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ClubBookPage({ params, searchParams }: Props) {
  const { slug }          = await params
  const { court, date }   = await searchParams

  const org = await getPublicOrg(slug)
  if (!org) notFound()

  if (org.courts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader slug={slug} name={org.name} />
        <main className="max-w-2xl mx-auto px-4 py-12 text-center space-y-3">
          <p className="text-4xl">🏟️</p>
          <p className="text-sm text-muted-foreground">
            Este club aún no tiene espacios disponibles para reservar.
          </p>
          <Link href={`/club/${slug}`} className="text-sm text-primary hover:underline">
            ← Volver al club
          </Link>
        </main>
      </div>
    )
  }

  const validCourt  = court && UUID_RE.test(court) && org.courts.find((c) => c.id === court)
  const validDate   = date && DATE_RE.test(date) ? date : undefined
  const showSlots   = !!validCourt && !!validDate

  const slots = showSlots
    ? await getPublicSlots(org.id, validCourt.id, validDate!)
    : null

  return (
    <div className="min-h-screen bg-background">
      <PageHeader slug={slug} name={org.name} />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <BookingFilterForm
          slug={slug}
          courts={org.courts}
          selectedCourt={validCourt ? validCourt.id : court}
          selectedDate={validDate}
        />

        {showSlots && slots && (
          <BookingSlotForm
            orgId={org.id}
            courtId={validCourt.id}
            courtName={validCourt.name}
            date={validDate!}
            slots={slots}
          />
        )}

        {!showSlots && (
          <p className="text-sm text-muted-foreground text-center pt-2">
            Selecciona un espacio y una fecha para ver los horarios disponibles.
          </p>
        )}
      </main>

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

function PageHeader({ slug, name }: { slug: string; name: string }) {
  return (
    <header className="border-b bg-card">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        <Link
          href={`/club/${slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Volver al club"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-bold leading-tight">{name}</h1>
          <p className="text-xs text-muted-foreground">Reservar espacio</p>
        </div>
      </div>
    </header>
  )
}
