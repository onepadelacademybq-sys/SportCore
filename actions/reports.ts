'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getPrisma }    from '@/lib/prisma'
import { CATEGORY_LABELS } from '@/lib/finances/labels'

const prisma = getPrisma()

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((data as any)?.role !== 'admin') redirect('/admin/dashboard')
}

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function last6MonthKeys(): { key: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { key: monthKey(d), label: MONTHS_ES[d.getMonth()] }
  })
}

// ── Types ────────────────────────────────────────────────────────────────────

export type MonthBucket = {
  key:     string
  label:   string
  income:  number
  expense: number
  net:     number
}

export type ReportData = {
  // Financial
  currentMonthLabel:  string
  monthIncome:        number
  monthExpense:       number
  netProfit:          number
  monthlyTrend:       MonthBucket[]
  incomeByCategory:   { label: string; total: number }[]
  expenseByCategory:  { label: string; total: number }[]

  // Bookings
  bookingsThisMonth:  number
  bookingsByStatus:   { status: string; count: number }[]

  // Players
  totalPlayers:       number
  activePlayers:      number
  playersByLevel:     { level: string; count: number }[]
  newPlayersByMonth:  { label: string; count: number }[]

  // Groups
  groups: { name: string; capacity: number; enrolled: number }[]

  // CRM
  leadsByStatus:  { status: string; count: number }[]
  leadsBySource:  { source: string; count: number }[]
  retentionDist:  { status: string; count: number }[]
  conversionRate: number
}

// ── Main query ────────────────────────────────────────────────────────────────

export async function getReportData(): Promise<ReportData> {
  await requireAdmin()

  const now   = new Date()
  const month = monthKey(now)
  const buckets = last6MonthKeys()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [txs, bookings, players, leads, retention, groups] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { type: true, category: true, amount: true, date: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { status: true, createdAt: true },
    }),
    prisma.profile.findMany({
      where: { role: 'player' },
      select: { isActive: true, padelLevel: true, createdAt: true },
    }),
    prisma.lead.findMany({
      select: { status: true, source: true },
    }),
    prisma.retentionScore.findMany({
      select: { status: true },
    }),
    prisma.trainingGroup.findMany({
      where: { status: 'active' },
      select: {
        name: true,
        maxCapacity: true,
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  // ── Financial ──────────────────────────────────────────────────────────────

  const trendMap = new Map<string, MonthBucket>(
    buckets.map((b) => [b.key, { ...b, income: 0, expense: 0, net: 0 }])
  )
  const incMap = new Map<string, number>()
  const expMap = new Map<string, number>()

  let monthIncome  = 0
  let monthExpense = 0

  for (const t of txs) {
    const amt = Number(t.amount)
    const key = monthKey(new Date(t.date))
    const bucket = trendMap.get(key)
    if (bucket) {
      if (t.type === 'income') { bucket.income += amt } else { bucket.expense += amt }
    }
    if (key === month) {
      if (t.type === 'income') {
        monthIncome += amt
        incMap.set(t.category, (incMap.get(t.category) ?? 0) + amt)
      } else {
        monthExpense += amt
        expMap.set(t.category, (expMap.get(t.category) ?? 0) + amt)
      }
    }
  }
  for (const b of trendMap.values()) b.net = b.income - b.expense

  const toList = (m: Map<string, number>) =>
    [...m.entries()].map(([k, v]) => ({ label: CATEGORY_LABELS[k as keyof typeof CATEGORY_LABELS] ?? k, total: v })).sort((a, b) => b.total - a.total)

  // ── Bookings ───────────────────────────────────────────────────────────────

  const bookingStatusMap = new Map<string, number>()
  let bookingsThisMonth = 0

  for (const b of bookings) {
    bookingStatusMap.set(b.status, (bookingStatusMap.get(b.status) ?? 0) + 1)
    if (monthKey(new Date(b.createdAt)) === month) bookingsThisMonth++
  }

  // ── Players ────────────────────────────────────────────────────────────────

  const levelMap = new Map<string, number>()
  const newByMonthMap = new Map<string, number>(buckets.map((b) => [b.key, 0]))

  for (const p of players) {
    if (p.padelLevel) levelMap.set(p.padelLevel, (levelMap.get(p.padelLevel) ?? 0) + 1)
    const key = monthKey(new Date(p.createdAt))
    if (newByMonthMap.has(key)) newByMonthMap.set(key, (newByMonthMap.get(key) ?? 0) + 1)
  }

  // ── CRM ────────────────────────────────────────────────────────────────────

  const leadStatusMap = new Map<string, number>()
  const leadSourceMap = new Map<string, number>()

  for (const l of leads) {
    leadStatusMap.set(l.status, (leadStatusMap.get(l.status) ?? 0) + 1)
    leadSourceMap.set(l.source, (leadSourceMap.get(l.source) ?? 0) + 1)
  }

  const retMap = new Map<string, number>()
  for (const r of retention) retMap.set(r.status, (retMap.get(r.status) ?? 0) + 1)

  const converted    = leadStatusMap.get('converted') ?? 0
  const totalLeads   = leads.length
  const convRate     = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0

  const now2 = new Date()
  const curLabel = `${MONTHS_ES[now2.getMonth()]} ${now2.getFullYear()}`

  return {
    currentMonthLabel: curLabel,
    monthIncome,
    monthExpense,
    netProfit: monthIncome - monthExpense,
    monthlyTrend:       [...trendMap.values()],
    incomeByCategory:   toList(incMap),
    expenseByCategory:  toList(expMap),

    bookingsThisMonth,
    bookingsByStatus: [...bookingStatusMap.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),

    totalPlayers:   players.length,
    activePlayers:  players.filter((p) => p.isActive).length,
    playersByLevel: [...levelMap.entries()].map(([level, count]) => ({ level, count })).sort((a, b) => b.count - a.count),
    newPlayersByMonth: buckets.map((b) => ({ label: b.label, count: newByMonthMap.get(b.key) ?? 0 })),

    groups: groups.map((g) => ({
      name:     g.name,
      capacity: g.maxCapacity,
      enrolled: g._count.members,
    })),

    leadsByStatus:  [...leadStatusMap.entries()].map(([status, count]) => ({ status, count })),
    leadsBySource:  [...leadSourceMap.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    retentionDist:  [...retMap.entries()].map(([status, count]) => ({ status, count })),
    conversionRate: convRate,
  }
}
