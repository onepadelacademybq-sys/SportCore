import Link from 'next/link'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Clase individual',
    price: '$70.000',
    period: 'por hora',
    description: 'Ideal para empezar o sesiones puntuales con tu entrenador.',
    features: [
      'Sesión 1:1 con entrenador certificado',
      'Plan de sesión personalizado',
      'Análisis técnico básico',
      'Reserva online en tiempo real',
    ],
    cta: 'Reservar clase',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Módulo 8 clases',
    price: '$450.000',
    period: 'paquete',
    description: 'El más popular. Ahorra y entrena con continuidad durante el mes.',
    features: [
      'Todo de la clase individual',
      '8 clases a tu ritmo',
      'Evaluación técnica incluida',
      'Seguimiento con app One Padel',
      'Acceso al dashboard de progreso',
    ],
    cta: 'Comenzar ahora',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Grupo mensual',
    price: '$180.000',
    period: 'por mes',
    description: 'Entrena en equipo con jugadores de tu nivel. Horario fijo semanal.',
    features: [
      'Clases grupales (máx. 4 jugadores)',
      'Horario fijo 2-3 veces/semana',
      'Plan de entrenamiento grupal',
      'Acceso a torneos internos',
      'Comunidad One Padel',
    ],
    cta: 'Unirse a un grupo',
    href: '/register',
    highlight: false,
  },
]

export function Pricing() {
  return (
    <section id="precios" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
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

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 space-y-6 relative ${
                plan.highlight
                  ? 'border-[#00C4CC] bg-[#00C4CC]/5 shadow-lg shadow-[#00C4CC]/10'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest bg-[#00C4CC] text-black px-3 py-1 rounded-full">
                    Más popular
                  </span>
                </div>
              )}

              <div>
                <h3 className="font-heading text-base font-semibold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="font-heading text-4xl font-bold tabular-nums">{plan.price}</span>
                  <span className="text-sm text-muted-foreground mb-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-[#00C4CC] shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-3 px-6 rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-[#00C4CC] text-black hover:bg-[#00b3ba]'
                    : 'border border-border hover:bg-muted/50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          ¿Tienes un grupo o empresa? Escríbenos para tarifas especiales.
        </p>
      </div>
    </section>
  )
}
