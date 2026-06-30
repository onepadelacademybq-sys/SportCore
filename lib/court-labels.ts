import type { ResourceType, CourtType, CourtSurface } from '@/actions/courts'

// Mapas de labels. Viven fuera de actions/courts.ts porque un archivo
// 'use server' solo puede exportar funciones async — no objetos de datos.

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  cancha: 'Cancha',
  campo:  'Campo',
  carril: 'Carril',
  pista:  'Pista',
  sala:   'Sala',
}

export const COURT_TYPE_LABELS: Record<CourtType, string> = {
  indoor:  'Cubierta',
  outdoor: 'Exterior',
}

export const SURFACE_LABELS: Record<CourtSurface, string> = {
  cesped_artificial: 'Césped artificial',
  moqueta:           'Moqueta',
  cristal:           'Cristal',
  hormigon:          'Hormigón',
}
