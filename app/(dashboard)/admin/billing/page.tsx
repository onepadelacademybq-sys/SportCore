import type { Metadata } from 'next'
import { Zap } from 'lucide-react'
import { getBillingStatus } from '@/actions/billing'
import { BillingDashboard } from '@/components/billing/billing-dashboard'

export const metadata: Metadata = { title: 'Plan y Facturación — SportCore' }

interface Props {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}

export default async function BillingPage({ searchParams }: Props) {
  const params  = await searchParams
  const billing = await getBillingStatus()

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan y Facturación</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu suscripción y límites de uso</p>
        </div>
      </div>

      <BillingDashboard
        billing={billing}
        success={params.success === 'true'}
        cancelled={params.cancelled === 'true'}
      />
    </div>
  )
}
