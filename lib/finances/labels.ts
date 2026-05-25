import type { FinancialCategory } from '@/actions/finances'

export const CATEGORY_LABELS: Record<FinancialCategory, string> = {
  booking_income: 'Reservas',
  group_income:   'Grupos',
  court_cost:     'Cancha',
  coach_payment:  'Entrenador',
  manual_expense: 'Gasto manual',
  manual_income:  'Ingreso manual',
}

export const INCOME_CATEGORIES: FinancialCategory[] = ['booking_income', 'group_income', 'manual_income']
export const EXPENSE_CATEGORIES: FinancialCategory[] = ['court_cost', 'coach_payment', 'manual_expense']
