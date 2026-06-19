'use server'

import { requireSuperAdmin } from '@/lib/superadmin'
import { getPrisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrgRow = {
  id:            string
  name:          string
  slug:          string
  sport:         string
  plan:          'starter' | 'pro' | 'enterprise'
  status:        'trialing' | 'active' | 'suspended' | 'cancelled'
  createdAt:     string
  trialEndsAt:   string | null
  planExpiresAt: string | null
  stripeSubId:   string | null
  members:       number
  coaches:       number
}

export type SuperAdminMetrics = {
  total:       number
  byPlan:      Record<string, number>
  byStatus:    Record<string, number>
  mrr:         number
}

const PLAN_MRR: Record<string, number> = {
  starter:    99,
  pro:        199,
  enterprise: 399,
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getSuperAdminData(): Promise<{ orgs: OrgRow[]; metrics: SuperAdminMetrics }> {
  await requireSuperAdmin()
  const prisma = getPrisma()

  const [rawOrgs, profileCounts] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:            true,
        name:          true,
        slug:          true,
        sport:         true,
        plan:          true,
        status:        true,
        createdAt:     true,
        trialEndsAt:   true,
        planExpiresAt: true,
        stripeSubId:   true,
      },
    }),
    prisma.profile.groupBy({
      by:    ['organizationId', 'role'],
      where: { isActive: true },
      _count: { id: true },
    }),
  ])

  type CountRow = { organizationId: string | null; role: string; _count: { id: number } }
  const countMap = new Map<string, { members: number; coaches: number }>()
  for (const row of profileCounts as CountRow[]) {
    if (!row.organizationId) continue
    if (!countMap.has(row.organizationId)) {
      countMap.set(row.organizationId, { members: 0, coaches: 0 })
    }
    const entry = countMap.get(row.organizationId)!
    if (row.role === 'player') entry.members = row._count.id
    if (row.role === 'coach')  entry.coaches = row._count.id
  }

  const orgs: OrgRow[] = rawOrgs.map((o) => ({
    ...o,
    plan:          o.plan as OrgRow['plan'],
    status:        o.status as OrgRow['status'],
    createdAt:     o.createdAt.toISOString(),
    trialEndsAt:   o.trialEndsAt?.toISOString()   ?? null,
    planExpiresAt: o.planExpiresAt?.toISOString() ?? null,
    members:       countMap.get(o.id)?.members ?? 0,
    coaches:       countMap.get(o.id)?.coaches ?? 0,
  }))

  const byPlan:   Record<string, number> = { starter: 0, pro: 0, enterprise: 0 }
  const byStatus: Record<string, number> = { trialing: 0, active: 0, suspended: 0, cancelled: 0 }
  let mrr = 0

  for (const org of orgs) {
    byPlan[org.plan]     = (byPlan[org.plan]     ?? 0) + 1
    byStatus[org.status] = (byStatus[org.status] ?? 0) + 1
    if (org.status === 'active') mrr += PLAN_MRR[org.plan] ?? 0
  }

  return { orgs, metrics: { total: orgs.length, byPlan, byStatus, mrr } }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

const PlanEnum   = z.enum(['starter', 'pro', 'enterprise'])
const StatusEnum = z.enum(['trialing', 'active', 'suspended', 'cancelled'])

export async function updateOrgPlan(
  orgId: string,
  plan:  string,
): Promise<{ error: string | null }> {
  await requireSuperAdmin()
  const parsed = PlanEnum.safeParse(plan)
  if (!parsed.success) return { error: 'Plan inválido' }

  const prisma = getPrisma()
  await prisma.organization.update({
    where: { id: orgId },
    data:  { plan: parsed.data },
  })

  revalidatePath('/superadmin')
  return { error: null }
}

export async function updateOrgStatus(
  orgId:  string,
  status: string,
): Promise<{ error: string | null }> {
  await requireSuperAdmin()
  const parsed = StatusEnum.safeParse(status)
  if (!parsed.success) return { error: 'Estado inválido' }

  const prisma = getPrisma()
  await prisma.organization.update({
    where: { id: orgId },
    data:  { status: parsed.data },
  })

  revalidatePath('/superadmin')
  return { error: null }
}
