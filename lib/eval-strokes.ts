export type ShotGroup = 'golpes_fondo' | 'voleas' | 'bandejas' | 'smash'

export const STROKE_GROUPS: { group: ShotGroup; label: string; strokes: string[] }[] = [
  {
    group: 'golpes_fondo',
    label: 'Golpes de Fondo',
    strokes: [
      'Drive cruzado',
      'Drive paralelo',
      'Drive globo',
      'Drive dejada',
      'Drive liftado',
      'Revés cruzado',
      'Revés paralelo',
      'Revés globo',
      'Revés dejada',
      'Revés liftado',
      'Bajada pared drive',
      'Bajada pared revés',
      'Contrapared drive',
      'Contrapared revés',
    ],
  },
  {
    group: 'voleas',
    label: 'Voleas',
    strokes: [
      'Volea drive cruzada',
      'Volea drive paralela',
      'Volea revés cruzada',
      'Volea revés paralela',
      'Volea alta drive',
      'Volea alta revés',
      'Volea baja drive',
      'Volea baja revés',
    ],
  },
  {
    group: 'bandejas',
    label: 'Bandejas',
    strokes: [
      'Bandeja cruzada',
      'Bandeja paralela',
      'Bandeja por tres',
      'Víbora',
      'Bandeja liftada',
      'Bandeja cortada',
      'Rulo',
    ],
  },
  {
    group: 'smash',
    label: 'Smash',
    strokes: [
      'Smash directo',
      'Smash por tres',
      'Smash por cuatro',
    ],
  },
]

export const GROUP_LABEL: Record<ShotGroup, string> = {
  golpes_fondo: 'Golpes de Fondo',
  voleas:       'Voleas',
  bandejas:     'Bandejas',
  smash:        'Smash',
}
