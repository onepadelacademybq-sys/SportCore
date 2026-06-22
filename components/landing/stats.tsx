const STATS = [
  { value: '150+', label: 'Jugadores activos' },
  { value: '5',    label: 'Entrenadores certificados' },
  { value: '4',    label: 'Pistas profesionales' },
  { value: '98%',  label: 'Satisfacción' },
]

export function Stats() {
  return (
    <section id="stats" className="border-y border-border bg-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-heading text-4xl font-bold text-brand tabular-nums">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
