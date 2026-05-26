import { User, Users, ClipboardList, Trophy, Calendar, TrendingUp } from 'lucide-react'

const SERVICES = [
  {
    icon: User,
    title: 'Clases individuales',
    description:
      'Sesiones 1:1 con un entrenador dedicado. Plan de entrenamiento adaptado a tu nivel y objetivos, con análisis técnico en cada sesión.',
    tags: ['Todos los niveles', 'Horario flexible'],
  },
  {
    icon: Users,
    title: 'Grupos de entrenamiento',
    description:
      'Grupos reducidos por nivel con horario fijo semanal. Aprende en equipo, compite y mejora junto a jugadores de tu misma categoría.',
    tags: ['Máx. 4 jugadores', 'Horario fijo'],
  },
  {
    icon: ClipboardList,
    title: 'Evaluación técnica V3',
    description:
      'Protocolo exclusivo de evaluación con 4 módulos: técnico, táctico, físico y antropométrico. Dashboard de progreso con gráficos de evolución.',
    tags: ['Protocolo V3', 'Seguimiento digital'],
  },
  {
    icon: Trophy,
    title: 'Torneos internos',
    description:
      'Competiciones periódicas entre miembros de la academia. Cuadros de eliminatoria, resultados en tiempo real y ranking actualizado.',
    tags: ['Clasificaciones en vivo', 'Todos los niveles'],
  },
  {
    icon: Calendar,
    title: 'Reserva de pistas',
    description:
      'Reserva tu pista online en minutos. Disponibilidad en tiempo real, pago con transferencia o E-wallet, y recordatorio automático.',
    tags: ['Online 24/7', 'E-wallet de clases'],
  },
  {
    icon: TrendingUp,
    title: 'Planificación periódica',
    description:
      'Mesociclos de entrenamiento estructurados semana a semana. Tu entrenador diseña cada sesión con ejercicios de la biblioteca oficial.',
    tags: ['Mesociclos', 'Biblioteca de ejercicios'],
  },
]

export function Services() {
  return (
    <section id="servicios" className="py-24 px-6 bg-muted/10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs text-[#00C4CC] uppercase tracking-widest font-semibold mb-3">
            Lo que ofrecemos
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Todo lo que necesitas para mejorar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Desde la primera clase hasta la competición, One Padel Academy cubre cada etapa de tu desarrollo como jugador.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-[#00C4CC]/30 hover:bg-[#00C4CC]/[0.02] transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#00C4CC]/10 flex items-center justify-center group-hover:bg-[#00C4CC]/20 transition-colors">
                <s.icon className="h-5 w-5 text-[#00C4CC]" />
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium text-[#00C4CC] bg-[#00C4CC]/10 rounded-full px-2.5 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
