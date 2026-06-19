import type { Metadata } from 'next'
import { LayoutGrid } from 'lucide-react'
import {
  getCourtsAdmin,
  RESOURCE_TYPE_LABELS,
  COURT_TYPE_LABELS,
  SURFACE_LABELS,
} from '@/actions/courts'
import type { Court, CourtStatus } from '@/actions/courts'
import { CourtActionsMenu } from '@/components/courts/court-actions-menu'
import { CreateCourtButton } from '@/components/courts/create-court-button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Espacios — Admin' }

const STATUS_BADGE: Record<
  CourtStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  active:      { label: 'Activo',        variant: 'default' },
  maintenance: { label: 'Mantenimiento', variant: 'secondary' },
  closed:      { label: 'Cerrado',       variant: 'destructive' },
}

function formatRate(rate: number): string {
  if (!rate) return '—'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(rate)
}

function CourtCard({ court }: { court: Court }) {
  const badge = STATUS_BADGE[court.status]
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{court.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {RESOURCE_TYPE_LABELS[court.resource_type]}
            {' · '}
            {COURT_TYPE_LABELS[court.type]}
            {' · '}
            {SURFACE_LABELS[court.surface]}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <CourtActionsMenu court={court} />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Tarifa:{' '}
        <span className="text-foreground font-medium">{formatRate(court.hourly_rate)}/h</span>
      </div>

      {court.notes && (
        <p className="text-xs text-muted-foreground border-t pt-2">{court.notes}</p>
      )}
    </div>
  )
}

export default async function AdminCourtsPage() {
  const courts = await getCourtsAdmin()

  const counts = {
    active:      courts.filter((c) => c.status === 'active').length,
    maintenance: courts.filter((c) => c.status === 'maintenance').length,
    closed:      courts.filter((c) => c.status === 'closed').length,
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Espacios Reservables</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Canchas, campos, carriles, pistas y salas de tu organización
          </p>
        </div>
        <CreateCourtButton />
      </div>

      {courts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Activos',       value: counts.active,      color: 'text-green-500' },
            { label: 'Mantenimiento', value: counts.maintenance, color: 'text-yellow-500' },
            { label: 'Cerrados',      value: counts.closed,      color: 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {courts.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <LayoutGrid className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Sin espacios registrados</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Agrega canchas, campos, carriles o salas para empezar a recibir reservas.
          </p>
          <CreateCourtButton />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      )}
    </div>
  )
}
