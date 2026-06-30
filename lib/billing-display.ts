// Datos de display de planes (sin dependencia de Stripe). Vive fuera de
// actions/billing.ts porque un archivo 'use server' solo puede exportar
// funciones async — no objetos de datos.

export const PLAN_DISPLAY = {
  starter: {
    name:     'Starter',
    desc:     'Academias que inician',
    limits:   '1 – 3 espacios · 60 miembros · 2 coaches',
    prices: {
      monthly:   { usd: 99,   label: '$99/mes',              billing: 'Facturado mensualmente' },
      quarterly: { usd: 84,   label: '$84/mes · $252/trim',  billing: 'Facturado cada 3 meses' },
      deferred:  { usd: 90,   label: '$90/mes · $1,080/año', billing: 'Contrato anual · 12 cuotas · 18% EA' },
      annual:    { usd: 990,  label: '$990/año · $83/mes',   billing: '2 meses gratis · pago único' },
    },
    savings: {
      quarterly: '$180/año',
      deferred:  '$108/año',
      annual:    '$198/año',
    },
  },
  pro: {
    name:     'Pro',
    desc:     'Academias en crecimiento',
    limits:   '4 – 7 espacios · 250 miembros · 6 coaches',
    prices: {
      monthly:   { usd: 199,  label: '$199/mes',               billing: 'Facturado mensualmente' },
      quarterly: { usd: 169,  label: '$169/mes · $507/trim',   billing: 'Facturado cada 3 meses' },
      deferred:  { usd: 180,  label: '$180/mes · $2,160/año',  billing: 'Contrato anual · 12 cuotas · 18% EA' },
      annual:    { usd: 1990, label: '$1,990/año · $166/mes',  billing: '2 meses gratis · pago único' },
    },
    savings: {
      quarterly: '$360/año',
      deferred:  '$228/año',
      annual:    '$398/año',
    },
  },
  enterprise: {
    name:     'Club',
    desc:     'Clubs grandes y complejos deportivos',
    limits:   '8+ espacios · miembros ilimitados · coaches ilimitados',
    prices: {
      monthly:   { usd: 399,  label: '$399/mes',               billing: 'Facturado mensualmente' },
      quarterly: { usd: 339,  label: '$339/mes · $1,017/trim', billing: 'Facturado cada 3 meses' },
      deferred:  { usd: 361,  label: '$361/mes · $4,332/año',  billing: 'Contrato anual · 12 cuotas · 18% EA' },
      annual:    { usd: 3990, label: '$3,990/año · $333/mes',  billing: '2 meses gratis · pago único' },
    },
    savings: {
      quarterly: '$720/año',
      deferred:  '$456/año',
      annual:    '$798/año',
    },
  },
} as const
