import { Target, Eye, Heart } from 'lucide-react'

export function Mission() {
  return (
    <section id="nosotros" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs text-brand uppercase tracking-widest font-semibold mb-3">
            Quiénes somos
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold">
            Más que una academia, una comunidad
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Misión */}
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-brand" />
            </div>
            <h3 className="font-heading text-lg font-semibold">Misión</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Liderar y transformar el pádel en Barranquilla, el Atlántico y Colombia mediante un modelo
              de formación deportiva de alta competencia que integra analítica de datos, software
              predictivo y seguimiento biomecánico en cancha para optimizar el rendimiento y masificar
              la disciplina.
            </p>
          </div>

          {/* Visión */}
          <div className="rounded-2xl border border-border bg-card p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <Eye className="h-6 w-6 text-brand" />
            </div>
            <h3 className="font-heading text-lg font-semibold">Visión</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Para el año 2030, consolidarnos como la academia y plataforma tecnológica de referencia
              absoluta en Latinoamérica, unificando la infraestructura deportiva física con experiencias
              de entrenamiento digitalizadas y automatizadas mediante inteligencia artificial.
            </p>
          </div>

          {/* Valores */}
          <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-brand" />
            </div>
            <h3 className="font-heading text-lg font-semibold">Valores</h3>
            <ul className="text-muted-foreground text-sm leading-relaxed space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">·</span>
                Excelencia técnica y metodología científica
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">·</span>
                Seguimiento individual y personalizado
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">·</span>
                Comunidad, respeto y deportividad
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand mt-0.5">·</span>
                Mejora continua en todo nivel
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
