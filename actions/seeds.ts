'use server'

import { getPrisma } from '@/lib/prisma'
import { SPORT_SEEDS, type SportKey } from '@/lib/seeds/sports'

/**
 * Siembra una organización con datos por defecto del deporte elegido.
 * Idempotente: no inserta ejercicios si el org ya tiene al menos uno.
 *
 * Llamado desde el onboarding (EPIC 8) justo después de crear la org.
 */
export async function seedOrganization(
  organizationId: string,
  sport:          SportKey,
  adminUserId:    string,
): Promise<{ seeded: boolean; exercisesCreated: number }> {
  const seed = SPORT_SEEDS[sport]
  if (!seed) return { seeded: false, exercisesCreated: 0 }

  const prisma = getPrisma()

  // ── 1. Actualizar terminología y deporte en la org ────────────────────────
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      sport:       sport,
      terminology: seed.terminology,
    },
  })

  // ── 2. Upsert academy_settings con horarios del deporte ───────────────────
  const [openH, openM]  = seed.settings.openingTime.split(':').map(Number)
  const [closeH, closeM] = seed.settings.closingTime.split(':').map(Number)

  const openingTime  = new Date(0)
  openingTime.setUTCHours(openH, openM, 0, 0)

  const closingTime  = new Date(0)
  closingTime.setUTCHours(closeH, closeM, 0, 0)

  await prisma.academySetting.upsert({
    where:  { organizationId },
    update: { openingTime, closingTime },
    create: { organizationId, openingTime, closingTime },
  })

  // ── 3. Insertar ejercicios solo si la org no tiene ninguno ────────────────
  const existing = await prisma.exercise.count({ where: { organizationId } })
  if (existing > 0) return { seeded: true, exercisesCreated: 0 }

  await prisma.exercise.createMany({
    data: seed.exercises.map((ex) => ({
      organizationId,
      createdBy:            adminUserId,
      name:                 ex.name,
      theme:                ex.theme,
      objective:            ex.objective,
      instructions:         ex.instructions ?? null,
      estimatedDurationMin: ex.estimatedDurationMin,
      materials:            ex.materials,
      isPublished:          true,
      // PadelLevel reutilizado como nivel genérico hasta EPIC multi-sport levels
      level: 'quinta_masculino' as const,
    })),
  })

  return { seeded: true, exercisesCreated: seed.exercises.length }
}
