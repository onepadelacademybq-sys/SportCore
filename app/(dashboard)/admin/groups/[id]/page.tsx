import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Users, AlertCircle, TrendingUp } from 'lucide-react'
import {
  getGroupById,
  getGroupMembers,
  getGroupPayments,
  getGroupFinancials,
  getPlayersForEnroll,
  updateGroupAction,
} from '@/actions/groups'
import { getCoaches, getCourts } from '@/actions/bookings'
import { calcBilling } from '@/lib/groups/billing'
import { LevelBadge } from '@/components/groups/level-badge'
import { GroupStatusBadge } from '@/components/groups/group-status-badge'
import { GroupForm } from '@/components/groups/group-form'
import { EnrollPlayerForm } from '@/components/groups/enroll-player-form'
import { RemovePlayerButton } from '@/components/groups/remove-player-button'
import { ConfirmGroupPaymentButton } from '@/components/groups/confirm-group-payment-button'
import { RejectGroupPaymentButton } from '@/components/groups/reject-group-payment-button'
import { ViewGroupProofButton } from '@/components/groups/view-group-proof-button'
import { RecordPaymentForm } from '@/components/groups/record-payment-form'
import { GeneratePaymentsButton } from '@/components/groups/generate-payments-button'
import { DeleteGroupButton } from '@/components/groups/delete-group-button'

export const metadata: Metadata = { title: 'Detalle de Grupo — Admin' }

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ year?: string; month?: string; tab?: string }>
}

export default async function AdminGroupDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { year: yearStr, month: monthStr, tab } = await searchParams

  const today = new Date()
  const periodYear  = parseInt(yearStr  ?? '') || today.getFullYear()
  const periodMonth = parseInt(monthStr ?? '') || today.getMonth() + 1

  const [group, members, payments, financials, coaches, courts, players] = await Promise.all([
    getGroupById(id),
    getGroupMembers(id),
    getGroupPayments(id, periodYear, periodMonth),
    getGroupFinancials(id, periodYear, periodMonth),
    getCoaches(),
    getCourts(),
    getPlayersForEnroll(),
  ])

  if (!group) notFound()

  const pendingPaymentMembers = members.filter((m) => m.status === 'pending_payment')
  const activeMembers         = members.filter((m) => m.status === 'active')
  const waitlistMembers       = members.filter((m) => m.status === 'waitlist')
  const activeTab = tab ?? 'members'

  // Prev / next month links
  const prevMonth = periodMonth === 1
    ? { year: periodYear - 1, month: 12 }
    : { year: periodYear, month: periodMonth - 1 }
  const nextMonth = periodMonth === 12
    ? { year: periodYear + 1, month: 1 }
    : { year: periodYear, month: periodMonth + 1 }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Grupos
        </Link>

        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <LevelBadge level={group.level} />
              <GroupStatusBadge status={group.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Entrenador: {group.coach?.full_name ?? '—'}
              {group.default_court && ` · ${group.default_court.name}`}
            </p>
            {group.schedules.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {group.schedules
                  .map((s) => `${DAY_NAMES[s.day_of_week]} ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`)
                  .join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Financial dashboard */}
      <section className="space-y-3">
        {/* Month navigator */}
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Panel financiero
          </h2>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Link
              href={`/admin/groups/${id}?year=${prevMonth.year}&month=${prevMonth.month}`}
              className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              ‹
            </Link>
            <span className="font-medium">{MONTH_NAMES[periodMonth]} {periodYear}</span>
            <Link
              href={`/admin/groups/${id}?year=${nextMonth.year}&month=${nextMonth.month}`}
              className="px-2 py-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              ›
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Esperado',
              value: `$${financials.expectedMonthly.toLocaleString('es-ES')}`,
              sub: `${financials.activeMemberCount} activos × $${Number(group.monthly_fee).toFixed(0)}`,
              color: 'text-foreground',
            },
            {
              label: 'Recaudado',
              value: `$${financials.collectedMonthly.toLocaleString('es-ES')}`,
              sub: `${financials.collectionRate.toFixed(0)}% de cobro`,
              color: financials.collectionRate >= 80 ? 'text-emerald-400' : 'text-amber-400',
            },
            {
              label: 'Pendientes',
              value: financials.pendingCount,
              sub: 'sin registrar',
              color: financials.pendingCount > 0 ? 'text-amber-400' : 'text-muted-foreground',
            },
            {
              label: 'Vencidos',
              value: financials.overdueCount,
              sub: 'morosos',
              color: financials.overdueCount > 0 ? 'text-red-400' : 'text-muted-foreground',
            },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Collection bar */}
        {financials.activeMemberCount > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tasa de cobro</span>
              <span className="font-medium text-foreground">{financials.collectionRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  financials.collectionRate >= 80 ? 'bg-emerald-500' :
                  financials.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(financials.collectionRate, 100)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {[
            { key: 'members',  label: 'Jugadores' },
            { key: 'billing',  label: 'Facturación' },
            { key: 'payments', label: 'Pagos históricos' },
            { key: 'edit',     label: 'Editar grupo' },
          ].map(({ key, label }) => (
            <Link
              key={key}
              href={`/admin/groups/${id}?year=${periodYear}&month=${periodMonth}&tab=${key}`}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab: Members */}
      {activeTab === 'members' && (
        <section className="space-y-6">

          {/* Pagos de inscripción pendientes */}
          {pendingPaymentMembers.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-orange-400">
                <AlertCircle className="h-4 w-4" />
                Pagos de inscripción pendientes ({pendingPaymentMembers.length})
              </h2>
              <div className="rounded-lg border border-orange-500/20 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jugador</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Estado pago</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendingPaymentMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{m.player?.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{m.player?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {m.payment_proof_url ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
                              Comprobante enviado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400">
                              Sin comprobante
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {m.payment_proof_url && (
                              <ViewGroupProofButton memberId={m.id} storagePath={m.payment_proof_url} />
                            )}
                            {m.payment_proof_url && (
                              <RejectGroupPaymentButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                            )}
                            <ConfirmGroupPaymentButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                            <RemovePlayerButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Jugadores activos
                <span className="text-sm font-normal text-muted-foreground">
                  ({activeMembers.length}/{group.max_capacity})
                </span>
              </h2>
            </div>

            {activeMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                No hay jugadores activos.
              </p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jugador</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Nivel</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Inscrito</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{m.player?.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{m.player?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                          {m.player?.padel_level ?? '—'}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                          {new Date(m.joined_at).toLocaleDateString('es-ES', { timeZone: 'America/Bogota' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RemovePlayerButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Enroll form */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-medium">Inscribir jugador</p>
              <EnrollPlayerForm groupId={group.id} players={players} />
            </div>
          </div>

          {/* Waitlist */}
          {waitlistMembers.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-amber-400">
                <AlertCircle className="h-4 w-4" />
                Lista de espera ({waitlistMembers.length})
              </h2>
              <div className="rounded-lg border border-amber-500/20 overflow-hidden">
                <table className="w-full text-sm min-w-[560px]">
                  <tbody className="divide-y divide-border">
                    {waitlistMembers.map((m, i) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 w-8 text-xs text-muted-foreground font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{m.player?.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{m.player?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                          En espera desde {new Date(m.joined_at).toLocaleDateString('es-ES', { timeZone: 'America/Bogota' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RemovePlayerButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab: Billing */}
      {activeTab === 'billing' && (
        <section className="space-y-6">
          {/* Pending inscription payments */}
          {pendingPaymentMembers.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold flex items-center gap-2 text-orange-400">
                <AlertCircle className="h-4 w-4" />
                Pagos de inscripción pendientes ({pendingPaymentMembers.length})
              </h2>
              <div className="rounded-lg border border-orange-500/20 overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jugador</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Tarifa</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Comprobante</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pendingPaymentMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{m.player?.full_name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{m.player?.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-sm font-mono">
                          ${Number(m.monthly_fee ?? group.monthly_fee).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {m.payment_proof_url ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
                              Enviado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400">
                              Sin enviar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {m.payment_proof_url && (
                              <ViewGroupProofButton memberId={m.id} storagePath={m.payment_proof_url} />
                            )}
                            {m.payment_proof_url && (
                              <RejectGroupPaymentButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                            )}
                            <ConfirmGroupPaymentButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                            <RemovePlayerButton memberId={m.id} playerName={m.player?.full_name ?? ''} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Active member billing cycles */}
          <div className="space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Ciclos de pago — jugadores activos
            </h2>

            {activeMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                No hay jugadores activos.
              </p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jugador</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Próximo venc.</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Monto</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeMembers.map((m) => {
                      const billing = calcBilling(m)
                      return (
                        <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium">{m.player?.full_name ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">{m.player?.email ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-xs text-muted-foreground">
                            {m.next_payment_due ?? '—'}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-sm font-mono">
                            {billing ? (
                              billing.isOverdue ? (
                                <span className="text-red-400">
                                  ${billing.amount.toLocaleString('es-CO')}
                                  <span className="text-xs ml-1 font-sans">(+10% mora)</span>
                                </span>
                              ) : (
                                `$${billing.fee.toLocaleString('es-CO')}`
                              )
                            ) : (
                              `$${Number(group.monthly_fee).toLocaleString('es-CO')}`
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {!billing || !m.next_payment_due ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                Sin ciclo
                              </span>
                            ) : billing.isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                Vencido {billing.daysLate}d
                              </span>
                            ) : billing.showWarning ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                                <AlertCircle className="h-3 w-3" />
                                Vence en {billing.daysUntilDue}d
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">
                                Al día
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab: Payments */}
      {activeTab === 'payments' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-semibold">
              Pagos — {MONTH_NAMES[periodMonth]} {periodYear}
            </h2>
            <GeneratePaymentsButton groupId={group.id} year={periodYear} month={periodMonth} />
          </div>

          {payments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                No hay registros de pago para este mes.
              </p>
              <p className="text-xs text-muted-foreground">
                Usa &ldquo;Generar cobros&rdquo; para crear registros pendientes para todos los activos.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="px-4 py-3">
                  <RecordPaymentForm
                    groupId={group.id}
                    payment={p}
                    year={periodYear}
                    month={periodMonth}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Overdue alerts */}
          {payments.some((p) => p.status === 'overdue') && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-1">
              <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Jugadores morosos
              </p>
              {payments
                .filter((p) => p.status === 'overdue')
                .map((p) => (
                  <p key={p.id} className="text-xs text-muted-foreground pl-6">
                    {p.player?.full_name} — debe ${Number(p.amount_due).toFixed(2)}
                  </p>
                ))}
            </div>
          )}
        </section>
      )}

      {/* Tab: Edit */}
      {activeTab === 'edit' && (
        <section className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-semibold">Editar grupo</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <GroupForm action={updateGroupAction} coaches={coaches} courts={courts} group={group} />
            </div>
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 space-y-3">
            <h3 className="font-semibold text-destructive text-sm">Zona de peligro</h3>
            <p className="text-xs text-muted-foreground">
              Eliminar el grupo borrará permanentemente todos sus miembros, pagos y sesiones. Esta acción no se puede deshacer.
            </p>
            <DeleteGroupButton groupId={group.id} groupName={group.name} />
          </div>
        </section>
      )}
    </div>
  )
}
