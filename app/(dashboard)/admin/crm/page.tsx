import type { Metadata } from 'next'
import { getPrisma } from '@/lib/prisma'
import type { LeadStatus, LeadSource } from '@/app/generated/prisma/enums'
import { RetentionBoard }  from '@/components/crm/retention-board'
import { LeadsPipeline }   from '@/components/crm/leads-pipeline'
import { CrmTabs }         from '@/components/crm/crm-tabs'

export const metadata: Metadata = { title: 'CRM — Admin' }

export default async function AdminCrmPage() {
  const prisma = getPrisma()

  const [leads, retentionScores] = await Promise.all([
    prisma.lead.findMany({
      include: {
        interactions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.retentionScore.findMany({
      include: {
        profile: {
          select: {
            id: true,
            fullName: true,
            whatsappPhone: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { score: 'asc' },
    }),
  ])

  const retention = {
    active:  retentionScores.filter((s) => s.status === 'active'),
    at_risk: retentionScores.filter((s) => s.status === 'at_risk'),
    losing:  retentionScores.filter((s) => s.status === 'losing'),
    churned: retentionScores.filter((s) => s.status === 'churned'),
  }

  const leadStats = {
    new:              leads.filter((l) => l.status === 'new').length,
    contacted:        leads.filter((l) => l.status === 'contacted').length,
    trial_scheduled:  leads.filter((l) => l.status === 'trial_scheduled').length,
    trial_done:       leads.filter((l) => l.status === 'trial_done').length,
    converted:        leads.filter((l) => l.status === 'converted').length,
    lost:             leads.filter((l) => l.status === 'lost').length,
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Pipeline de prospectos, retención de estudiantes y comunicación por WhatsApp
          </p>
        </div>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Prospectos activos"  value={leadStats.new + leadStats.contacted + leadStats.trial_scheduled + leadStats.trial_done} color="blue" />
        <KpiCard label="Convertidos (total)" value={leadStats.converted} color="green" />
        <KpiCard label="En riesgo"           value={retention.at_risk.length + retention.losing.length} color="amber" />
        <KpiCard label="Inactivos (churned)" value={retention.churned.length} color="red" />
      </div>

      <CrmTabs
        leads={leads as LeadWithInteraction[]}
        retention={retention as RetentionGroups}
        leadStats={leadStats}
      />
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:  'border-blue-500/30 bg-blue-500/5',
    green: 'border-green-500/30 bg-green-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    red:   'border-red-500/30 bg-red-500/5',
  }
  const nums: Record<string, string> = {
    blue:  'text-blue-400',
    green: 'text-green-400',
    amber: 'text-amber-400',
    red:   'text-red-400',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className={`text-2xl font-bold ${nums[color]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

// Re-export types used by child components
export type LeadWithInteraction = {
  id: string
  name: string
  phone: string
  whatsapp: string | null
  email: string | null
  source: LeadSource
  status: LeadStatus
  sport: string | null
  notes: string | null
  lostReason: string | null
  convertedAt: Date | null
  profileId: string | null
  assignedTo: string | null
  createdAt: Date
  updatedAt: Date
  interactions: { type: string; summary: string; createdAt: Date }[]
}

export type RetentionGroups = {
  active:  RetentionEntry[]
  at_risk: RetentionEntry[]
  losing:  RetentionEntry[]
  churned: RetentionEntry[]
}

export type RetentionEntry = {
  id: string
  score: number
  status: string
  lastClassAt: Date | null
  classesThisMonth: number
  alertSentAt: Date | null
  profile: {
    id: string
    fullName: string
    whatsappPhone: string | null
    phone: string | null
    avatarUrl: string | null
  }
}
