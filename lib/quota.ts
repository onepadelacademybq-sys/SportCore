import { getPrisma } from '@/lib/prisma'

type QuotaResource = 'resources' | 'members' | 'coaches'

type PlanLimits = {
  max_resources: number
  max_members:   number
  max_coaches:   number
}

const DEFAULT_LIMITS: PlanLimits = {
  max_resources: 6,
  max_members:   100,
  max_coaches:   3,
}

// ── Obtiene los límites actuales de la organización ────────────────────────

export async function getOrgLimits(organizationId: string): Promise<PlanLimits> {
  const prisma = getPrisma()
  const org = await prisma.organization.findUnique({
    where:  { id: organizationId },
    select: { planLimits: true, status: true },
  })

  if (!org || org.status === 'suspended' || org.status === 'cancelled') {
    return { max_resources: 0, max_members: 0, max_coaches: 0 }
  }

  const raw = org.planLimits as Partial<PlanLimits> | null
  return {
    max_resources: raw?.max_resources ?? DEFAULT_LIMITS.max_resources,
    max_members:   raw?.max_members   ?? DEFAULT_LIMITS.max_members,
    max_coaches:   raw?.max_coaches   ?? DEFAULT_LIMITS.max_coaches,
  }
}

// ── Verifica si una acción excede el límite del plan ──────────────────────

export async function checkQuota(
  organizationId: string,
  resource: QuotaResource
): Promise<{ allowed: boolean; current: number; limit: number; plan: string }> {
  const prisma = getPrisma()

  const [limits, org] = await Promise.all([
    getOrgLimits(organizationId),
    prisma.organization.findUnique({
      where:  { id: organizationId },
      select: { plan: true },
    }),
  ])

  const plan = org?.plan ?? 'starter'

  let current = 0
  let limit   = 0

  switch (resource) {
    case 'resources': {
      limit   = limits.max_resources
      current = await prisma.court.count()
      break
    }
    case 'members': {
      limit   = limits.max_members
      current = await prisma.profile.count({
        where: { role: 'player', isActive: true, organizationId },
      })
      break
    }
    case 'coaches': {
      limit   = limits.max_coaches
      current = await prisma.profile.count({
        where: { role: 'coach', isActive: true, organizationId },
      })
      break
    }
  }

  return { allowed: current < limit, current, limit, plan }
}

// ── Error de quota — lanza si la acción no está permitida ─────────────────

export async function assertQuota(organizationId: string, resource: QuotaResource) {
  const result = await checkQuota(organizationId, resource)

  if (!result.allowed) {
    const names: Record<QuotaResource, string> = {
      resources: 'recursos (canchas/camas)',
      members:   'miembros activos',
      coaches:   'entrenadores',
    }
    throw new Error(
      `Límite del plan alcanzado: ${result.current}/${result.limit} ${names[resource]}. ` +
      `Actualiza tu plan para continuar. Plan actual: ${result.plan}.`
    )
  }

  return result
}

// ── Resumen de uso para el dashboard ──────────────────────────────────────

export async function getQuotaSummary(organizationId: string) {
  const [resources, members, coaches] = await Promise.all([
    checkQuota(organizationId, 'resources'),
    checkQuota(organizationId, 'members'),
    checkQuota(organizationId, 'coaches'),
  ])

  return { resources, members, coaches }
}
