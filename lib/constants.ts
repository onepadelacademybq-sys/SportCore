// App-wide constants: routes, roles, padel levels, session block types, etc.
export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PLAYER: 'player',
} as const

export const PADEL_LEVELS = [
  '5ta_masculino',
  '6ta_masculino',
  '7ma_masculino',
  'femenino_d',
  'femenino_c',
  'juvenil_s18',
  'juvenil_s16',
  'juvenil_s14',
  'prejuvenil',
  'baby_padel',
] as const

export const PADEL_LEVEL_LABELS: Record<string, string> = {
  '5ta_masculino': '5ta Masculino',
  '6ta_masculino': '6ta Masculino',
  '7ma_masculino': '7ma Masculino',
  'femenino_d':    'Femenino D',
  'femenino_c':    'Femenino C',
  'juvenil_s18':   'Juvenil S18',
  'juvenil_s16':   'Juvenil S16',
  'juvenil_s14':   'Juvenil S14',
  'prejuvenil':    'Prejuvenil (8 a 12 años)',
  'baby_padel':    'Baby Pádel (5 a 9 años)',
}

/** Etiquetas abreviadas para tarjetas y vistas compactas */
export const PADEL_LEVEL_LABELS_SHORT: Record<string, string> = {
  '5ta_masculino': '5ta Masc.',
  '6ta_masculino': '6ta Masc.',
  '7ma_masculino': '7ma Masc.',
  'femenino_d':    'Fem. D',
  'femenino_c':    'Fem. C',
  'juvenil_s18':   'S18',
  'juvenil_s16':   'S16',
  'juvenil_s14':   'S14',
  'prejuvenil':    'Prejuv.',
  'baby_padel':    'Baby',
}

export const SESSION_BLOCK_TYPES = [
  'calentamiento',
  'central_1_defensa',
  'central_2_ataque',
  'vuelta_a_la_calma',
] as const

export const ROUTES = {
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  COACH_DASHBOARD: '/coach/dashboard',
  PLAYER_DASHBOARD: '/player/dashboard',
} as const
