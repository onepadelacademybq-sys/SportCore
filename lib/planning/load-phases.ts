// Capa de carga (Sección 6 del planificador): fases de contenido b/e/c/T por microciclo.
// Base: Navarro (naturaleza básico/específico/competitivo) + NSCA (mapeo y parámetros).

export const CONTENT_PHASES = [
  { value: 'basico',      short: 'B', label: 'Básico',      nsca: 'Hipertrofia / Fuerza base', color: '#3b82f6' },
  { value: 'especifico',  short: 'E', label: 'Específico',  nsca: 'Fuerza – Potencia',         color: '#00C4CC' },
  { value: 'competitivo', short: 'C', label: 'Competitivo', nsca: 'Pico / Competición',        color: '#f59e0b' },
  { value: 'transicion',  short: 'T', label: 'Transición',  nsca: 'Descarga / Recuperación',   color: '#6b7280' },
] as const

export const CONTENT_PHASE_VALUES = CONTENT_PHASES.map((p) => p.value)

export const CONTENT_PHASE_BY_VALUE: Record<string, (typeof CONTENT_PHASES)[number]> =
  Object.fromEntries(CONTENT_PHASES.map((p) => [p.value, p]))

// Escala de intensidad de pádel (1–5): método de alimentación / tipo de bola.
export const INTENSITY_SCALE = [
  { value: 1, label: 'Alimentación manual, bola muerta' },
  { value: 2, label: 'Alimentación manual, bola viva' },
  { value: 3, label: 'Alimentación con pala, bola viva' },
  { value: 4, label: 'Bola viva cooperativa' },
  { value: 5, label: 'Bola viva competitiva' },
] as const

export const INTENSITY_LABELS: Record<number, string> =
  Object.fromEntries(INTENSITY_SCALE.map((i) => [i.value, i.label]))

// Parámetros de carga sugeridos por fase (NSCA). Referencia editable por el coach; no se persisten.
export const PHASE_PARAMS: Record<string, { sets: string; reps: string; load: string; rpe: string }> = {
  basico:      { sets: '3–6', reps: '10–20',  load: '50–75% 1RM', rpe: '6–7' },
  especifico:  { sets: '3–5', reps: '2–5',    load: '80–90% 1RM', rpe: '8' },
  competitivo: { sets: '1–3', reps: '1–3',    load: '≥90% 1RM',   rpe: '9' },
  transicion:  { sets: '1–2', reps: 'ligero', load: '<50% 1RM',   rpe: '3–4' },
}
