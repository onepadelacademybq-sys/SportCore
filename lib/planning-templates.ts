export type MesocycleTemplate = {
  id:               string
  name:             string
  durationWeeks:    number
  totalSessions:    number
  generalObjective: string
}

export type MicrocycleType = {
  id:          string
  name:        string
  focus:       string
  description: string
}

export const MESOCYCLE_TEMPLATES: MesocycleTemplate[] = [
  {
    id:               'golpes_de_fondo',
    name:             'Golpes de fondo',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar el control de los golpes de fondo',
  },
  {
    id:               'cristal_de_fondo',
    name:             'Cristal de fondo',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar el control de los golpes de cristal de fondo',
  },
  {
    id:               'cristal_lateral_esquinas',
    name:             'Cristal lateral y esquinas',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar el control de los golpes en las defensas de las dobles paredes',
  },
  {
    id:               'volea',
    name:             'Volea',
    durationWeeks:    8,
    totalSessions:    16,
    generalObjective: 'Desarrollar el control de la volea de derecha y revés en sus variaciones',
  },
  {
    id:               'bandeja_vibora_bajada',
    name:             'Bandeja, víbora y bajada de pared',
    durationWeeks:    4,
    totalSessions:    10,
    generalObjective: 'Desarrollar el control de la bandeja en sus cuatro variaciones',
  },
  {
    id:               'smash_rulo',
    name:             'Smash y rulo',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar la mecánica del smash plano y el rulo',
  },
  {
    id:               'smash_liftado',
    name:             'Smash x3, x4 y liftado',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar la mecánica del smash liftado, x3 y x4',
  },
  {
    id:               'transicion_vertical',
    name:             'Transición vertical',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar la velocidad y resistencia para transiciones',
  },
  {
    id:               'transicion_horizontal',
    name:             'Transiciones horizontales',
    durationWeeks:    4,
    totalSessions:    8,
    generalObjective: 'Desarrollar la velocidad y resistencia para transiciones horizontales',
  },
  {
    id:               'tactica_de_juego',
    name:             'Táctica de juego',
    durationWeeks:    4,
    totalSessions:    10,
    generalObjective: 'Aprender y comprender las tácticas básicas',
  },
]

export const MICROCYCLE_TYPES: MicrocycleType[] = [
  {
    id:          'acumulacion',
    name:        'Acumulación',
    focus:       'Ganancia técnica',
    description: 'Se prioriza el método analítico y la repetición en situaciones técnicas concretas en ambientes muy controlados',
  },
  {
    id:          'transformacion',
    name:        'Transformación',
    focus:       'Ejecución técnica priorizando objetivos tácticos',
    description: 'Se prioriza el método analítico con desplazamiento y mayor dificultad',
  },
  {
    id:          'realizacion',
    name:        'Realización',
    focus:       'Ejecución técnica basado en situación real de juego',
    description: 'Se prioriza el método de bola viva en ambientes poco controlados',
  },
]
