/**
 * Siembra datos de un deporte en una organización existente.
 *
 * Uso:
 *   npm run seed:sport -- --org=<orgId> --sport=<sport> --admin=<adminUserId>
 *
 * Deportes disponibles: padel | tenis | futbol | natacion | baloncesto
 *
 * Requiere en .env.local:
 *   DATABASE_URL  (o DIRECT_URL para conexión directa)
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { SPORT_SEEDS, SUPPORTED_SPORTS, type SportKey } from '../lib/seeds/sports'
import { getPrisma } from '../lib/prisma'

// ── Parse args ────────────────────────────────────────────────────────────────

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length)
}

const orgId   = getArg('org')
const sport   = getArg('sport') as SportKey | undefined
const adminId = getArg('admin')

if (!orgId || !sport || !adminId) {
  console.error('Uso: npm run seed:sport -- --org=<orgId> --sport=<sport> --admin=<adminUserId>')
  console.error(`Deportes disponibles: ${SUPPORTED_SPORTS.join(' | ')}`)
  process.exit(1)
}

if (!SUPPORTED_SPORTS.includes(sport)) {
  console.error(`Deporte inválido: "${sport}". Opciones: ${SUPPORTED_SPORTS.join(', ')}`)
  process.exit(1)
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function run() {
  const seed   = SPORT_SEEDS[sport!]
  const prisma = getPrisma()

  console.log(`\n🌱 Sembrando "${seed.label}" en org ${orgId}...\n`)

  // 1. Actualizar terminología
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      sport:       sport,
      terminology: seed.terminology,
    },
  })
  console.log(`✔ Terminología: recurso="${seed.terminology.resource}" · coach="${seed.terminology.coach}" · jugador="${seed.terminology.player}"`)

  // 2. Upsert academy_settings
  const [openH, openM]   = seed.settings.openingTime.split(':').map(Number)
  const [closeH, closeM] = seed.settings.closingTime.split(':').map(Number)
  const openingTime = new Date(0); openingTime.setUTCHours(openH, openM, 0, 0)
  const closingTime = new Date(0); closingTime.setUTCHours(closeH, closeM, 0, 0)

  await prisma.academySetting.upsert({
    where:  { organizationId: orgId },
    update: { openingTime, closingTime },
    create: { organizationId: orgId, openingTime, closingTime },
  })
  console.log(`✔ Horario: ${seed.settings.openingTime} – ${seed.settings.closingTime}`)

  // 3. Ejercicios (idempotente)
  const existing = await prisma.exercise.count({ where: { organizationId: orgId } })
  if (existing > 0) {
    console.log(`⚠ Ya existen ${existing} ejercicios para esta org. Omitiendo inserción de ejercicios.`)
  } else {
    await prisma.exercise.createMany({
      data: seed.exercises.map((ex) => ({
        organizationId: orgId,
        createdBy:            adminId!,
        name:                 ex.name,
        theme:                ex.theme,
        objective:            ex.objective,
        instructions:         ex.instructions ?? null,
        estimatedDurationMin: ex.estimatedDurationMin,
        materials:            ex.materials,
        isPublished:          true,
        level:                'quinta_masculino',
      })),
    })
    console.log(`✔ ${seed.exercises.length} ejercicios creados`)
  }

  console.log(`\n✅ Seed de ${seed.label} completado.\n`)
  await prisma.$disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
