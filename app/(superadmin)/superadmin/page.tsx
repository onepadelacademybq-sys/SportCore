import { getSuperAdminData } from '@/actions/superadmin'
import { SuperAdminDashboard } from '@/components/superadmin/superadmin-dashboard'

export default async function SuperAdminPage() {
  const { orgs, metrics } = await getSuperAdminData()
  return <SuperAdminDashboard orgs={orgs} metrics={metrics} />
}
