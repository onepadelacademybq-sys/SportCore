import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-brand/5 pointer-events-none" />

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--brand) 1px, transparent 1px), linear-gradient(90deg, var(--brand) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/5 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 text-xs text-brand bg-brand/10 border border-brand/20 rounded-full px-4 py-1.5 mb-8 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          Academia de pádel en Barranquilla
        </div>

        <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
          Transforma tu juego{' '}
          <span className="text-brand">con metodología</span>{' '}
          de alto rendimiento
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Entrenamiento personalizado, seguimiento técnico y una comunidad apasionada por el pádel.
          Todos los niveles, desde iniciación hasta competición.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-brand text-black font-semibold text-base hover:bg-[#00b3ba] transition-colors shadow-lg shadow-brand/20"
          >
            Inscríbete ahora <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#servicios"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Ver servicios
          </a>
        </div>
      </div>

      {/* Scroll hint */}
      <a
        href="#stats"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </a>
    </section>
  )
}
