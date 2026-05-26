import Link from 'next/link'
import { Check, Shield, Tag } from 'lucide-react'

// ─── Clases personalizadas ───────────────────────────────────────────────────

const FRANJAS = [
  {
    label: 'AM',
    sublabel: 'Lun – Vie · 5:00 – 15:00',
    individual: '$86.000',
    trio: '$106.000',
    cuarteto: '$116.000',
    highlight: false,
  },
  {
    label: 'PM',
    sublabel: 'Lun – Vie · 16:00 – 21:00',
    individual: '$130.000',
    trio: '$150.000',
    cuarteto: '$160.000',
    highlight: true,
  },
  {
    label: 'FDS',
    sublabel: 'Sáb, Dom y festivos',
    individual: '$138.000',
    trio: '$158.000',
    cuarteto: '$168.000',
    highlight: false,
  },
]

// ─── Módulos con descuento ───────────────────────────────────────────────────

const MODULES = [
  {
    label: '8 clases AM',
    sublabel: 'Lun – Vie · 5:00 – 15:00',
    dto: '7% dto',
    individual: '$640.000',
    trio: '$788.600',
    cuarteto: '$863.000',
  },
  {
    label: '8 clases PM',
    sublabel: 'Lun – Vie · 16:00 – 21:00',
    dto: '7% dto',
    individual: '$967.200',
    trio: '$1.116.000',
    cuarteto: '$1.190.400',
  },
  {
    label: '16 clases AM',
    sublabel: 'Lun – Vie · 5:00 – 15:00',
    dto: '15% dto',
    individual: '$1.169.600',
    trio: '$1.441.600',
    cuarteto: '$1.577.600',
  },
  {
    label: '16 clases PM',
    sublabel: 'Lun – Vie · 16:00 – 21:00',
    dto: '15% dto',
    individual: '$1.768.000',
    trio: '$2.040.000',
    cuarteto: '$2.176.000',
  },
]

// ─── Grupos mensuales ────────────────────────────────────────────────────────

const GROUPS = [
  {
    name: 'Baby Pádel',
    tag: 'Infantil',
    price: '$260.000',
    details: 'Máx 8 jugadores',
    highlight: false,
    features: [
      'Clases grupales para niños',
      'Metodología lúdica y formativa',
      'Horario fijo semanal',
      'Comunidad One Padel',
    ],
  },
  {
    name: 'Grupo Básico',
    tag: 'Adultos y juveniles',
    price: '$290.000',
    details: 'Máx 4 jugadores',
    highlight: false,
    features: [
      'Clases 2 – 3 veces por semana',
      'Plan de entrenamiento grupal',
      'Acceso a torneos internos',
      'Comunidad One Padel',
    ],
  },
  {
    name: 'Alto Rendimiento',
    tag: 'Adultos y juveniles',
    price: '$380.000',
    details: 'Máx 4 jugadores',
    highlight: true,
    features: [
      'Todo del Grupo Básico',
      'Evaluación V3 bimestral incluida',
      'Seguimiento biomecánico en cancha',
      'Dashboard de progreso individual',
      'Analítica de rendimiento',
    ],
  },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] text-[#00C4CC] uppercase tracking-widest font-semibold mb-1">{tag}</p>
      <h3 className="font-heading text-xl font-bold">{title}</h3>
    </div>
  )
}

function PriceTable({ rows }: {
  rows: Array<{
    label: string
    sublabel: string
    dto?: string
    individual: string
    trio: string
    cuarteto: string
    highlight?: boolean
  }>
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-4 gap-0 border-b border-border bg-muted/20">
        <div className="px-5 py-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Franja</span>
        </div>
        {['Individual / Dupla', 'Trío', 'Cuarteto'].map((h) => (
          <div key={h} className="px-4 py-3 text-right border-l border-border">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{h}</span>
          </div>
        ))}
      </div>

      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`grid grid-cols-4 gap-0 ${i < rows.length - 1 ? 'border-b border-border' : ''} ${
            row.highlight ? 'bg-[#00C4CC]/5' : ''
          }`}
        >
          {/* Franja */}
          <div className="px-5 py-4 flex items-start gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  row.highlight
                    ? 'bg-[#00C4CC]/20 text-[#00C4CC]'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {row.label}
                </span>
                {row.dto && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">
                    <Tag className="h-2.5 w-2.5" />
                    {row.dto}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{row.sublabel}</p>
            </div>
          </div>

          {/* Precios */}
          {[row.individual, row.trio, row.cuarteto].map((price, j) => (
            <div key={j} className="px-4 py-4 text-right border-l border-border flex items-center justify-end">
              <span className={`font-heading text-base font-bold tabular-nums ${
                row.highlight ? 'text-[#00C4CC]' : 'text-foreground'
              }`}>
                {price}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function Pricing() {
  return (
    <section id="precios" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs text-[#00C4CC] uppercase tracking-widest font-semibold mb-3">
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
        <div className="mb-10 rounded-xl border border-border bg-card px-6 py-4 flex items-start gap-4"
          style={{ borderLeft: '4px solid #00C4CC' }}>
          <Shield className="h-5 w-5 text-[#00C4CC] shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">Transparencia One Padel:</span>{' '}
            Todas nuestras tarifas incluyen el costo de alquiler de la cancha. Sin cobros sorpresa.
          </p>
        </div>

        <div className="space-y-14">

          {/* ── Clases personalizadas ── */}
          <div>
            <SectionHeader tag="Por sesión" title="Clases personalizadas" />
            <p className="text-sm text-muted-foreground mb-5">
              Precio por hora de clase. Las tarifas aplican para la sesión completa sin importar cuántas personas comparten la cancha.
            </p>
            <PriceTable rows={FRANJAS} />
          </div>

          {/* ── Módulos ── */}
          <div>
            <SectionHeader tag="Paquetes" title="Módulos con descuento" />
            <p className="text-sm text-muted-foreground mb-5">
              Ahorra comprando un módulo de clases. El descuento se aplica automáticamente al precio unitario de la franja.
            </p>
            <PriceTable rows={MODULES} />
          </div>

          {/* ── Grupos ── */}
          <div>
            <SectionHeader tag="Mensual" title="Grupos de entrenamiento" />
            <p className="text-sm text-muted-foreground mb-5">
              Tarifa mensual por jugador. Horario fijo semanal incluido.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {GROUPS.map((g) => (
                <div
                  key={g.name}
                  className={`rounded-2xl border p-7 space-y-5 relative flex flex-col ${
                    g.highlight
                      ? 'border-[#00C4CC] bg-[#00C4CC]/5 shadow-lg shadow-[#00C4CC]/10'
                      : 'border-border bg-card'
                  }`}
                >
                  {g.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest bg-[#00C4CC] text-black px-3 py-1 rounded-full">
                        Más completo
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-base font-semibold">{g.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{g.tag} · {g.details}</p>
                    <div className="mt-4 flex items-end gap-1">
                      <span className="font-heading text-3xl font-bold tabular-nums">{g.price}</span>
                      <span className="text-sm text-muted-foreground mb-1">/mes</span>
                    </div>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {g.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-[#00C4CC] shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`block text-center py-2.5 px-6 rounded-lg text-sm font-semibold transition-colors ${
                      g.highlight
                        ? 'bg-[#00C4CC] text-black hover:bg-[#00b3ba]'
                        : 'border border-border hover:bg-muted/50'
                    }`}
                  >
                    Unirse
                  </Link>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            ¿Tienes un grupo o empresa? Escríbenos para tarifas especiales.
          </p>
          <Link
            href="#contacto"
            className="text-xs text-[#00C4CC] hover:underline font-medium"
          >
            Contáctanos →
          </Link>
        </div>
      </div>
    </section>
  )
}
