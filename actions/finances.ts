'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { courtCost, coachPayment, DEFAULT_COACH_RATES, type CoachRates } from '@/lib/finances/pricing'

type Supa = Awaited<ReturnType<typeof createClient>>

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type FinancialCategory =
  | 'booking_income'
  | 'group_income'
  | 'court_cost'
  | 'coach_payment'
  | 'manual_expense'
  | 'manual_income'

export type FinancialTxType = 'income' | 'expense'

export type FinancialTx = {
  id: string
  type: FinancialTxType
  category: FinancialCategory
  amount: number
  description: string
  booking_id: string | null
  group_id: string | null
  bank_account_id: string | null
  date: string        // YYYY-MM-DD
  created_at: string
}

export type CategoryTotal = { category: FinancialCategory; total: number }

export type WeekFlow = { label: string; income: number; expense: number; net: number }

export type FinancialDashboard = {
  month: string            // "2026-05"
  monthIncome: number
  monthExpense: number
  netProfit: number
  incomeByCategory: CategoryTotal[]
  expenseByCategory: CategoryTotal[]
  cashFlowByWeek: WeekFlow[]
}

export type BankAccount = {
  id: string
  name: string
  bank_name: string
  account_number: string | null
  account_type: 'ahorros' | 'corriente'
  current_balance: number
  currency: string
  is_active: boolean
  created_at: string
}

export type FinanceActionState = { error: string | null; success?: string }

// ─── Guards ───────────────────────────────────────────────────────────────────

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  const profile = data as { id: string; role: string } | null
  if (!profile) redirect('/login')

  return { supabase, userId: user.id, role: profile.role }
}

async function requireAdmin() {
  const ctx = await requireAuth()
  if (ctx.role !== 'admin') redirect('/admin/dashboard')
  return ctx
}

// ─── Utilidades de fecha ──────────────────────────────────────────────────────

function toDateOnly(d: Date): string {
  return d.toISOString().split('T')[0]
}

function monthRange(ref = new Date()): { from: string; to: string; month: string } {
  const year = ref.getFullYear()
  const month = ref.getMonth() // 0-based
  const first = new Date(year, month, 1)
  const next = new Date(year, month + 1, 1)
  const mm = String(month + 1).padStart(2, '0')
  return { from: toDateOnly(first), to: toDateOnly(next), month: `${year}-${mm}` }
}

function num(v: unknown): number {
  return typeof v === 'number' ? v : Number(v ?? 0)
}

// ─── Helpers internos (invocados desde otras actions) ─────────────────────────

/**
 * Registra las transacciones automáticas de una reserva al confirmarla:
 *   - booking_income  = precio de la reserva (si > 0)
 *   - court_cost      = horas × $70.000   (solo si es una clase real, no compra de módulo)
 *   - coach_payment   = tarifa del coach prorrateada por franja (solo clase real, con coach)
 * Idempotente: si la reserva ya tiene transacciones, no hace nada.
 */
export async function recordBookingFinancials(
  supabase: Supa,
  bookingId: string,
  userId: string,
): Promise<void> {
  // Idempotencia: salir si ya existen transacciones para esta reserva
  const { data: existing } = await supabase
    .from('financial_transactions')
    .select('id')
    .eq('booking_id', bookingId)
    .limit(1)

  if (existing && existing.length > 0) return

  const { data: bookingRow } = await supabase
    .from('bookings')
    .select('id, price, start_time, end_time, coach_id, module_classes')
    .eq('id', bookingId)
    .single()

  const booking = bookingRow as {
    id: string
    price: string | number
    start_time: string
    end_time: string
    coach_id: string | null
    module_classes: number | null
  } | null

  if (!booking) return

  const start = new Date(booking.start_time)
  const end = new Date(booking.end_time)
  const date = toDateOnly(start)
  const price = num(booking.price)
  const isModulePurchase = !!booking.module_classes && booking.module_classes > 0

  const rows: Record<string, unknown>[] = []

  if (price > 0) {
    rows.push({
      type: 'income',
      category: 'booking_income',
      amount: price,
      description: 'Ingreso por reserva confirmada',
      booking_id: bookingId,
      date,
      created_by: userId,
    })
  }

  // La compra de un módulo de clases no consume cancha ni entrenador todavía:
  // esos costos se registran cuando cada clase se juega (reserva con wallet).
  if (!isModulePurchase) {
    const court = courtCost(start, end)
    if (court > 0) {
      rows.push({
        type: 'expense',
        category: 'court_cost',
        amount: court,
        description: 'Costo operativo de cancha',
        booking_id: bookingId,
        date,
        created_by: userId,
      })
    }

    if (booking.coach_id) {
      const rates = await coachRatesFor(supabase, booking.coach_id)
      const pay = coachPayment(start, end, rates)
      if (pay > 0) {
        rows.push({
          type: 'expense',
          category: 'coach_payment',
          amount: pay,
          description: 'Pago al entrenador por la clase',
          booking_id: bookingId,
          date,
          created_by: userId,
        })
      }
    }
  }

  if (rows.length > 0) {
    await supabase.from('financial_transactions').insert(rows)
  }
}

/** Tarifas del entrenador; usa los defaults si el coach no tiene perfil con tarifas. */
async function coachRatesFor(supabase: Supa, coachId: string): Promise<CoachRates> {
  const { data } = await supabase
    .from('coach_profiles')
    .select('hourly_rate_am, hourly_rate_pm, hourly_rate_weekend')
    .eq('coach_id', coachId)
    .maybeSingle()

  const r = data as { hourly_rate_am: number; hourly_rate_pm: number; hourly_rate_weekend: number } | null
  if (!r) return DEFAULT_COACH_RATES
  return {
    am: num(r.hourly_rate_am) || DEFAULT_COACH_RATES.am,
    pm: num(r.hourly_rate_pm) || DEFAULT_COACH_RATES.pm,
    weekend: num(r.hourly_rate_weekend) || DEFAULT_COACH_RATES.weekend,
  }
}

/**
 * Registra un ingreso de grupo por el incremento de un pago (delta).
 * Llamado desde recordPaymentAction; `amount` es la diferencia (nuevo - anterior).
 * Se omite si el delta es 0.
 */
export async function recordGroupIncome(
  supabase: Supa,
  params: {
    groupId: string
    amount: number
    periodYear: number
    periodMonth: number
    date: string
    userId: string
  },
): Promise<void> {
  if (!params.amount || params.amount === 0) return

  const mm = String(params.periodMonth).padStart(2, '0')
  await supabase.from('financial_transactions').insert({
    type: 'income',
    category: 'group_income',
    amount: params.amount,
    description: `Pago de grupo · ${params.periodYear}-${mm}`,
    group_id: params.groupId,
    date: params.date,
    created_by: params.userId,
  })
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getFinancialDashboard(): Promise<FinancialDashboard> {
  const { supabase } = await requireAdmin()
  const { from, to, month } = monthRange()

  const { data } = await supabase
    .from('financial_transactions')
    .select('type, category, amount, date')
    .gte('date', from)
    .lt('date', to)

  const txs = (data ?? []) as { type: FinancialTxType; category: FinancialCategory; amount: string | number; date: string }[]

  let monthIncome = 0
  let monthExpense = 0
  const incomeMap = new Map<FinancialCategory, number>()
  const expenseMap = new Map<FinancialCategory, number>()

  // 5 cubos semanales por día del mes: 1-7, 8-14, 15-21, 22-28, 29+
  const weeks: WeekFlow[] = [1, 2, 3, 4, 5].map((w) => ({
    label: `Sem ${w}`,
    income: 0,
    expense: 0,
    net: 0,
  }))

  for (const t of txs) {
    const amount = num(t.amount)
    const day = Number(t.date.split('-')[2])
    const wi = Math.min(4, Math.floor((day - 1) / 7))

    if (t.type === 'income') {
      monthIncome += amount
      incomeMap.set(t.category, (incomeMap.get(t.category) ?? 0) + amount)
      weeks[wi].income += amount
    } else {
      monthExpense += amount
      expenseMap.set(t.category, (expenseMap.get(t.category) ?? 0) + amount)
      weeks[wi].expense += amount
    }
  }

  for (const w of weeks) w.net = w.income - w.expense

  const toTotals = (m: Map<FinancialCategory, number>): CategoryTotal[] =>
    [...m.entries()].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total)

  return {
    month,
    monthIncome,
    monthExpense,
    netProfit: monthIncome - monthExpense,
    incomeByCategory: toTotals(incomeMap),
    expenseByCategory: toTotals(expenseMap),
    cashFlowByWeek: weeks,
  }
}

// ─── Listados con filtros ─────────────────────────────────────────────────────

export type TxFilters = {
  from?: string       // YYYY-MM-DD inclusive
  to?: string         // YYYY-MM-DD inclusive
  category?: FinancialCategory
}

async function listTransactions(type: FinancialTxType, filters: TxFilters = {}): Promise<FinancialTx[]> {
  const { supabase } = await requireAdmin()

  let q = supabase
    .from('financial_transactions')
    .select('id, type, category, amount, description, booking_id, group_id, bank_account_id, date, created_at')
    .eq('type', type)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters.from) q = q.gte('date', filters.from)
  if (filters.to) q = q.lte('date', filters.to)
  if (filters.category) q = q.eq('category', filters.category)

  const { data } = await q
  return ((data ?? []) as FinancialTx[]).map((t) => ({ ...t, amount: num(t.amount) }))
}

export async function getIncomes(filters?: TxFilters): Promise<FinancialTx[]> {
  return listTransactions('income', filters)
}

export async function getExpenses(filters?: TxFilters): Promise<FinancialTx[]> {
  return listTransactions('expense', filters)
}

// ─── Egresos / ingresos manuales ───────────────────────────────────────────────

const ManualTxSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  description: z.string().trim().min(3, 'Describe el movimiento'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  bankAccountId: z.string().uuid().optional(),
})

export async function createManualExpense(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { supabase, userId } = await requireAdmin()

  const parsed = ManualTxSchema.safeParse({
    amount: formData.get('amount'),
    description: formData.get('description'),
    date: formData.get('date'),
    bankAccountId: formData.get('bankAccountId') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { amount, description, date, bankAccountId } = parsed.data
  const { error } = await supabase.from('financial_transactions').insert({
    type: 'expense',
    category: 'manual_expense',
    amount,
    description,
    date,
    bank_account_id: bankAccountId ?? null,
    created_by: userId,
  })

  if (error) {
    console.error('[createManualExpense]', error)
    return { error: 'No se pudo registrar el egreso.' }
  }

  revalidatePath('/admin/finances')
  return { error: null, success: 'Egreso registrado.' }
}

export async function createManualIncome(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { supabase, userId } = await requireAdmin()

  const parsed = ManualTxSchema.safeParse({
    amount: formData.get('amount'),
    description: formData.get('description'),
    date: formData.get('date'),
    bankAccountId: formData.get('bankAccountId') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { amount, description, date, bankAccountId } = parsed.data
  const { error } = await supabase.from('financial_transactions').insert({
    type: 'income',
    category: 'manual_income',
    amount,
    description,
    date,
    bank_account_id: bankAccountId ?? null,
    created_by: userId,
  })

  if (error) {
    console.error('[createManualIncome]', error)
    return { error: 'No se pudo registrar el ingreso.' }
  }

  revalidatePath('/admin/finances')
  return { error: null, success: 'Ingreso registrado.' }
}

// ─── Cuentas bancarias ─────────────────────────────────────────────────────────

export async function getBankAccounts(): Promise<BankAccount[]> {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from('bank_accounts')
    .select('id, name, bank_name, account_number, account_type, current_balance, currency, is_active, created_at')
    .order('created_at', { ascending: true })

  return ((data ?? []) as BankAccount[]).map((a) => ({ ...a, current_balance: num(a.current_balance) }))
}

const BankAccountSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  bankName: z.string().trim().min(2, 'El banco es obligatorio'),
  accountNumber: z.string().trim().max(4, 'Solo los últimos 4 dígitos').optional(),
  accountType: z.enum(['ahorros', 'corriente']),
  currentBalance: z.coerce.number().min(0, 'El saldo no puede ser negativo'),
  currency: z.string().trim().min(1).default('COP'),
})

export async function createBankAccountAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { supabase } = await requireAdmin()

  const parsed = BankAccountSchema.safeParse({
    name: formData.get('name'),
    bankName: formData.get('bankName'),
    accountNumber: formData.get('accountNumber') || undefined,
    accountType: formData.get('accountType'),
    currentBalance: formData.get('currentBalance') || 0,
    currency: formData.get('currency') || 'COP',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, bankName, accountNumber, accountType, currentBalance, currency } = parsed.data
  const { error } = await supabase.from('bank_accounts').insert({
    name,
    bank_name: bankName,
    account_number: accountNumber ?? null,
    account_type: accountType,
    current_balance: currentBalance,
    currency,
  })

  if (error) {
    console.error('[createBankAccountAction]', error)
    return { error: 'No se pudo crear la cuenta.' }
  }

  revalidatePath('/admin/finances')
  return { error: null, success: 'Cuenta creada.' }
}

export async function updateBankAccountAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { supabase } = await requireAdmin()

  const id = z.string().uuid().safeParse(formData.get('id'))
  if (!id.success) return { error: 'Cuenta inválida' }

  const parsed = BankAccountSchema.safeParse({
    name: formData.get('name'),
    bankName: formData.get('bankName'),
    accountNumber: formData.get('accountNumber') || undefined,
    accountType: formData.get('accountType'),
    currentBalance: formData.get('currentBalance') || 0,
    currency: formData.get('currency') || 'COP',
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, bankName, accountNumber, accountType, currentBalance, currency } = parsed.data
  const { error } = await supabase
    .from('bank_accounts')
    .update({
      name,
      bank_name: bankName,
      account_number: accountNumber ?? null,
      account_type: accountType,
      current_balance: currentBalance,
      currency,
    })
    .eq('id', id.data)

  if (error) {
    console.error('[updateBankAccountAction]', error)
    return { error: 'No se pudo actualizar la cuenta.' }
  }

  revalidatePath('/admin/finances')
  return { error: null, success: 'Cuenta actualizada.' }
}

export async function setBankAccountActiveAction(
  _prev: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { supabase } = await requireAdmin()

  const id = z.string().uuid().safeParse(formData.get('id'))
  if (!id.success) return { error: 'Cuenta inválida' }
  const isActive = formData.get('isActive') === 'true'

  const { error } = await supabase
    .from('bank_accounts')
    .update({ is_active: isActive })
    .eq('id', id.data)

  if (error) return { error: 'No se pudo cambiar el estado de la cuenta.' }

  revalidatePath('/admin/finances')
  return { error: null, success: isActive ? 'Cuenta activada.' : 'Cuenta desactivada.' }
}
