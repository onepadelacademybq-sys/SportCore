import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Wallet, CalendarDays, UsersRound, ClipboardList, LayoutList, BookOpen, Clock, Users } from 'lucide-react'
import { getUserProfile } from '@/actions/users'
import type { CoachData } from '@/actions/users'
import { formatDate, formatBookingDateTime, formatCOP } from '@/lib/format'
import { RoleBadge } from '@/components/users/role-badge'
import { LevelBadge } from '@/components/groups/level-badge'
import { StatusBadge } from '@/components/bookings/status-badge'
import { UserActions } from '@/components/users/user-actions'

export const metadata: Metadata = { title: 'Perfil de usuario — Admin' }

type Props = { params: Promise<{ id: string }> }

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>{title}
      </h2>
      {children}
    </div>
  )
}

const MESO_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Borrador',  cls: 'text-muted-foreground' },
  active:   { label: 'Activo',    cls: 'text-emerald-500' },
  archived: { label: 'Archivado', cls: 'text-amber-400' },
}

function CoachSections({ coach }: { coach: CoachData }) {
  return (
    <>
      {/* Clases impartidas */}
      <Section title="Clases impartidas" icon={<BookOpen className="h-4 w-4" />}>
        {coach.taughtClasses.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin clases registradas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {coach.taughtClasses.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <span className="text-sm">{formatBookingDateTime(b.start_time, b.end_time)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-muted-foreground">{formatCOP(b.price)}</span>
                  <StatusBadge status={b.status as Parameters<typeof StatusBadge>[0]['status']} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Sesiones planificadas (mesociclos) */}
      <Section title="Sesiones planificadas" icon={<LayoutList className="h-4 w-4" />}>
        {coach.mesocycles.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin mesociclos creados.</p>
        ) : (
          <ul className="divide-y divide-border">
            {coach.mesocycles.map((m) => {
              const s = MESO_STATUS[m.status] ?? { label: m.status, cls: 'text-muted-foreground' }
              return (
                <li key={m.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <Link href={`/admin/planning/${m.id}`} className="text-sm hover:text-[#00C4CC] hover:underline truncate block">{m.name}</Link>
                    <p className="text-[11px] text-muted-foreground">{m.duration_weeks} semanas{m.start_date ? ` · inicio ${formatDate(m.start_date + 'T12:00:00')}` : ''}</p>
                  </div>
                  <span className={`text-xs shrink-0 ${s.cls}`}>{s.label}</span>
                </li>
              )
            })}
          </ul>
        )}
      </Section>

      {/* Tareas pendientes — próximas clases */}
      <Section title="Tareas pendientes" icon={<Clock className="h-4 w-4" />}>
        {coach.upcomingClasses.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin clases próximas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {coach.upcomingClasses.map((b) => (
              <li key={b.id} className="py-2 first:pt-0 last:pb-0">
                <span className="text-sm">{formatBookingDateTime(b.start_time, b.end_time)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Jugadores asignados */}
      <Section title="Jugadores asignados" icon={<Users className="h-4 w-4" />}>
        {coach.assignedPlayers.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin jugadores asignados en grupos activos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {coach.assignedPlayers.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div className="min-w-0 pr-3">
                  <Link href={`/admin/users/${p.id}`} className="text-sm font-medium hover:text-[#00C4CC] hover:underline truncate block">{p.full_name}</Link>
                  <p className="text-[11px] text-muted-foreground truncate">{p.group_name} · {p.email}</p>
                </div>
                {p.padel_level && <LevelBadge level={p.padel_level} />}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params
  const data = await getUserProfile(id)
  if (!data) notFound()

  const { profile, bookings, groups, evaluations, assignments, payment, wallet } = data
  const paidRate = payment.total > 0 ? Math.round((payment.paid / payment.total) * 100) : 0

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Back */}
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Volver a usuarios
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <RoleBadge role={profile.role} />
            {profile.padel_level && <LevelBadge level={profile.padel_level} />}
          </div>
          <p className="text-muted-foreground text-sm mt-1">{profile.email}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-sm shrink-0 ${profile.is_active ? 'text-emerald-500' : 'text-muted-foreground'}`}>
          <span className={`size-2 rounded-full ${profile.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
          {profile.is_active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información personal — siempre visible */}
          <Section title="Información personal" icon={<UsersRound className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <Field label="Nombre completo" value={profile.full_name} />
              <Field label="Email" value={profile.email} />
              <Field label="Documento" value={profile.document_id} />
              <Field label="Teléfono" value={profile.phone} />
              <Field label="Fecha de nacimiento" value={profile.date_of_birth ? formatDate(`${profile.date_of_birth}T12:00:00`) : null} />
              <Field label="Dirección" value={profile.address} />
              <Field label="Registrado" value={formatDate(profile.created_at)} />
            </div>
          </Section>

          {profile.role === 'coach' && data.coach ? (
            <CoachSections coach={data.coach} />
          ) : (
            <>
              {/* Comportamiento de pago */}
              <Section title="Comportamiento de pago" icon={<CalendarDays className="h-4 w-4" />}>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold tabular-nums">{payment.total}</p>
                    <p className="text-[11px] text-muted-foreground">Reservas</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums text-emerald-500">{payment.paid}</p>
                    <p className="text-[11px] text-muted-foreground">Pagadas</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums text-amber-400">{payment.pending}</p>
                    <p className="text-[11px] text-muted-foreground">Pendientes</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold tabular-nums text-[#00C4CC]">{paidRate}%</p>
                    <p className="text-[11px] text-muted-foreground">Tasa de pago</p>
                  </div>
                </div>
              </Section>

              {/* Reservas recientes */}
              <Section title="Reservas recientes" icon={<CalendarDays className="h-4 w-4" />}>
                {bookings.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin reservas.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {bookings.map((b) => (
                      <li key={b.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <span className="text-sm">{formatBookingDateTime(b.start_time, b.end_time)}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs tabular-nums text-muted-foreground">{formatCOP(b.price)}</span>
                          <StatusBadge status={b.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Grupos */}
              <Section title="Grupos inscritos" icon={<UsersRound className="h-4 w-4" />}>
                {groups.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No está inscrito en ningún grupo.</p>
                ) : (
                  <ul className="space-y-2">
                    {groups.map((g) => (
                      <li key={g.id} className="flex items-center justify-between">
                        <Link href={`/admin/groups/${g.id}`} className="text-sm hover:text-[#00C4CC] hover:underline">{g.name}</Link>
                        <LevelBadge level={g.level} />
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Evaluaciones */}
              <Section title="Evaluaciones realizadas" icon={<ClipboardList className="h-4 w-4" />}>
                {evaluations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin evaluaciones.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {evaluations.map((e) => (
                      <li key={e.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <Link href={`/admin/evaluations/${e.id}`} className="text-sm hover:text-[#00C4CC] hover:underline truncate pr-3">{e.title}</Link>
                        <div className="flex items-center gap-3 shrink-0">
                          {e.is_shared && <span className="text-[10px] text-[#00C4CC]">Compartida</span>}
                          <span className="text-xs text-muted-foreground">{formatDate(e.evaluated_at)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              {/* Planificaciones */}
              <Section title="Planificaciones asignadas" icon={<LayoutList className="h-4 w-4" />}>
                {assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin planificaciones asignadas.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {assignments.map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                        <span className="text-sm truncate pr-3">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(a.assigned_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UserActions userId={profile.id} currentRole={profile.role} isActive={profile.is_active} />

          {/* E-wallet — solo para jugadores */}
          {profile.role !== 'coach' && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" /> E-wallet de clases
              </h3>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold tabular-nums text-[#00C4CC]">{wallet.available_classes}</p>
                <p className="text-xs text-muted-foreground mb-1">clases disponibles</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {wallet.total_classes} acreditadas · {wallet.used_classes} usadas
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
