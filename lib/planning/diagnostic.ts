// Catálogo del diagnóstico de periodización (Secciones 1-2 del planificador).
// Fuente única para formularios, vistas de detalle y el futuro recomendador de modelo.

export const ATHLETE_LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio',   label: 'Intermedio' },
  { value: 'avanzado',     label: 'Avanzado' },
] as const

export const COMPETITION_TYPES = [
  { value: 'aislada',  label: 'Aislada' },
  { value: 'agrupada', label: 'Agrupada' },
] as const

export const PERIODIZATION_MODELS = [
  { value: 'regular',     label: 'Cargas regulares (lineal)' },
  { value: 'concentrado', label: 'Cargas concentradas (bloques)' },
  { value: 'dup',         label: 'Ondulante diario (DUP)' },
] as const

export const QUALITIES = [
  { value: 'fuerza_max',     label: 'Fuerza máxima' },
  { value: 'potencia',       label: 'Potencia / F. explosiva' },
  { value: 'velocidad',      label: 'Velocidad' },
  { value: 'agilidad',       label: 'Agilidad' },
  { value: 'res_aerobica',   label: 'Resistencia aeróbica' },
  { value: 'res_anaerobica', label: 'Resistencia anaeróbica' },
  { value: 'flexibilidad',   label: 'Flexibilidad / Movilidad' },
  { value: 'tecnica',        label: 'Técnica' },
  { value: 'tactica',        label: 'Táctica' },
  { value: 'coordinacion',   label: 'Coordinación' },
  { value: 'mental',         label: 'Psicológico / Mental' },
] as const

export const ATHLETE_LEVEL_VALUES = ATHLETE_LEVELS.map((o) => o.value)
export const COMPETITION_TYPE_VALUES = COMPETITION_TYPES.map((o) => o.value)
export const PERIODIZATION_MODEL_VALUES = PERIODIZATION_MODELS.map((o) => o.value)
export const QUALITY_VALUES = QUALITIES.map((o) => o.value)

export const ATHLETE_LEVEL_LABELS: Record<string, string> = Object.fromEntries(ATHLETE_LEVELS.map((o) => [o.value, o.label]))
export const COMPETITION_TYPE_LABELS: Record<string, string> = Object.fromEntries(COMPETITION_TYPES.map((o) => [o.value, o.label]))
export const PERIODIZATION_MODEL_LABELS: Record<string, string> = Object.fromEntries(PERIODIZATION_MODELS.map((o) => [o.value, o.label]))
export const QUALITY_LABELS: Record<string, string> = Object.fromEntries(QUALITIES.map((o) => [o.value, o.label]))
