import Link from 'next/link'
import { Check, Shield, Sun, Moon, CalendarDays, Tag, ClipboardList } from 'lucide-react'

// ─── Clases por sesión ────────────────────────────────────────────────────────

const SESSION_CARDS = [
  {
    icon: Sun,
    label: 'Clase AM',
    sublabel: 'Individual / Dupla',
    franja: 'Lun – Vie · 5:00 – 15:00',
    price: '$86.000',
    period: '/hora',
    savings: null,
    features: [
      '1 hora con entrenador certificado',
      'Plan de sesión personalizado',
      'Análisis técnico en cancha',
    ],
    cta: 'Agendar clase',
    highlight: false,
  },
  {
    icon: Moon,
    label: 'Clase PM',
    sublabel: 'Individual / Dupla',
    franja: 'Lun – Vie · 16:00 – 21:00',
    price: '$130.000',
    period: '/hora',
    savings: null,
    features: [
      '1 hora con entrenador certificado',
      'Plan de sesión personalizado',
      'Análisis técnico en cancha',
    ],
    cta: 'Agendar clase',
    highlight: true,
  },
  {
    icon: CalendarDays,
    label: 'Clase Fin de semana',
    sublabel: 'Individual / Dupla',
    franja: 'Sáb, Dom y festivos',
    price: '$138.000',
    period: '/hora',
    savings: null,
    features: [
      '1 hora con entrenador certificado',
      'Plan de sesión personalizado',
      'Análisis técnico en cancha',
    ],
    cta: 'Agendar clase',
    highlight: false,
  },
]

// ─── Módulos ──────────────────────────────────────────────────────────────────

const MODULE_CARDS = [
  {
    label: '8 clases AM',
    sublabel: 'Individual / Dupla',
    franja: 'Lun – Vie · 5:00 – 15:00',
    price: '$640.000',
    savings: 'Ahorra 7%',
    evalV3: false,
    features: [
      '8 horas de entrenamiento',
      'Franja AM flexible',
      'Reserva online en tiempo real',
    ],
    cta: 'Comprar módulo',
    highlight: false,
  },
  {
    label: '8 clases PM',
    sublabel: 'Individual / Dupla',
    franja: 'Lun – Vie · 16:00 – 21:00',
    price: '$967.200',
    savings: 'Ahorra 7%',
    evalV3: false,
    features: [
      '8 horas de entrenamiento',
      'Franja PM flexible',
      'Reserva online en tiempo real',
    ],
    cta: 'Comprar módulo',
    highlight: false,
  },
  {
    label: '16 clases AM',
    sublabel: 'Individual / Dupla',
    franja: 'Lun – Vie · 5:00 – 15:00',
    price: '$1.169.600',
    savings: 'Ahorra 15%',
    evalV3: true,
    features: [
      '16 horas de entrenamiento',
      'Evaluación V3 incluida',
      'Dashboard de progreso personal',
      'Seguimiento biomecánico',
    ],
    cta: 'Comprar módulo',
    highlight: true,
  },
  {
    label: '16 clases PM',
    sublabel: 'Individual / Dupla',
    franja: 'Lun – Vie · 16:00 – 21:00',
    price: '$1.768.000',
    savings: 'Ahorra 15%',
    evalV3: true,
    features: [
      '16 horas de entrenamiento',
      'Evaluación V3 incluida',
      'Dashboard de progreso personal',
      'Seguimiento biomecánico',
    ],
    cta: 'Comprar módulo',
    highlight: false,
  },
]

// ─── Tabla de precios para Trío y Cuarteto ────────────────────────────────────

const TRIO_CUARTETO = [
  { franja: 'AM · Lun–Vie',     trio: '$106.000',   cuarteto: '$116.000'   },
  { franja: 'PM · Lun–Vie',     trio: '$150.000',   cuarteto: '$160.000'   },
  { franja: 'FDS / festivos',   trio: '$158.000',   cuarteto: '$168.000'   },
  { franja: 'Módulo 8 AM',      trio: '$788.600',   cuarteto: '$863.000'   },
  { franja: 'Módulo 8 PM',      trio: '$1.116.000', cuarteto: '$1.190.400' },
  { franja: 'Módulo 16 AM',     trio: '$1.441.600', cuarteto: '$1.577.600' },
  { franja: 'Módulo 16 PM',     trio: '$2.040.000', cuarteto: '$2.176.000' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function Pricing() {
  return (
    <section id="precios" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs text-brand uppercase tracking-widest font-semibold mb-3">
            Planes y precios
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Elige cómo quieres entrenar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Precios en pesos colombianos. Sin matrícula ni contratos. Empieza cuando quieras.
          </p>
        </div>

        {/* Transparency banner */}
        <div
          className="mb-12 rounded-xl border border-border bg-card px-6 py-4 flex items-start gap-4"
          style={{ borderLeft: '4px solid var(--brand)' }}
        >
          <Shield className="h-5 w-5 text-brand shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">Transparencia One Padel:</span>{' '}
            Todas nuestras tarifas incluyen el costo de alquiler de la cancha. Sin cobros sorpresa.
          </p>
        </div>

        {/* ── Clases personalizadas ── */}
        <div className="mb-16">
          <div className="mb-6">
            <p className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-1">Por sesión</p>
            <h3 className="font-heading text-xl font-bold">Clases personalizadas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Individual o dupla. Precio por hora, incluye cancha y entrenador.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {SESSION_CARDS.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border p-7 space-y-5 flex flex-col ${
                  card.highlight
                    ? 'border-brand bg-brand/5 shadow-lg shadow-brand/10'
                    : 'border-border bg-card'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                    <card.icon className="h-5 w-5 text-brand" />
                  </div>
                  <h4 className="font-heading text-base font-semibold">{card.label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.franja}</p>
                  <div className="mt-4 flex items-end gap-1">
                    <span className={`font-heading text-3xl font-bold tabular-nums ${card.highlight ? 'text-brand' : ''}`}>
                      {card.price}
                    </span>
                    <span className="text-sm text-muted-foreground mb-1">{card.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center py-2.5 px-6 rounded-lg text-sm font-semibold transition-colors ${
                    card.highlight
                      ? 'bg-brand text-black hover:bg-[#00b3ba]'
                      : 'border border-border hover:bg-muted/50'
                  }`}
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Módulos ── */}
        <div className="mb-16">
          <div className="mb-6">
            <p className="text-[10px] text-brand uppercase tracking-widest font-semibold mb-1">Paquetes</p>
            <h3 className="font-heading text-xl font-bold">Módulos con descuento</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Compra clases por paquete y ahorra. Los módulos de 16 clases incluyen Evaluación V3.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {MODULE_CARDS.map((card) => (
              <div
                key={card.label}
                className={`rounded-2xl border p-7 space-y-5 flex flex-col relative ${
                  card.highlight
                    ? 'border-brand bg-brand/5 shadow-lg shadow-brand/10'
                    : 'border-border bg-card'
                }`}
              >
                {card.highlight && (
                  <div className="absolute -top-3.5 left-6">
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest bg-brand text-black px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="font-heading text-base font-semibold">{card.label}</h4>
                    {card.evalV3 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                        <ClipboardList className="h-2.5 w-2.5" />
                        Eval. V3
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{card.franja}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className={`font-heading text-3xl font-bold tabular-nums ${card.highlight ? 'text-brand' : ''}`}>
                      {card.price}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md mb-1">
                      <Tag className="h-2.5 w-2.5" />
                      {card.savings}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {card.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center py-2.5 px-6 rounded-lg text-sm font-semibold transition-colors ${
                    card.highlight
                      ? 'bg-brand text-black hover:bg-[#00b3ba]'
                      : 'border border-border hover:bg-muted/50'
                  }`}
                >
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trío y Cuarteto ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground">
              Precios para Trío (3 personas) y Cuarteto (4 personas) — por sesión o módulo
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-[11px] text-muted-foreground font-medium">Modalidad</th>
                  <th className="text-right px-4 py-3 text-[11px] text-muted-foreground font-medium">Trío</th>
                  <th className="text-right px-6 py-3 text-[11px] text-muted-foreground font-medium">Cuarteto</th>
                </tr>
              </thead>
              <tbody>
                {TRIO_CUARTETO.map((row, i) => (
                  <tr key={row.franja} className={i < TRIO_CUARTETO.length - 1 ? 'border-b border-border' : ''}>
                    <td className="px-6 py-3 text-muted-foreground">{row.franja}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{row.trio}</td>
                    <td className="px-6 py-3 text-right font-medium tabular-nums">{row.cuarteto}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            ¿Tienes un grupo o empresa? Escríbenos para tarifas especiales.
          </p>
          <a href="#contacto" className="text-xs text-brand hover:underline font-medium">
            Contáctanos →
          </a>
        </div>

      </div>
    </section>
  )
}
