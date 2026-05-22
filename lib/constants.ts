// App-wide constants: routes, roles, padel levels, session block types, etc.
export const ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PLAYER: 'player',
} as const

export const PADEL_LEVELS = ['iniciacion', 'intermedio', 'avanzado', 'elite'] as const

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
