import { requireSuperAdmin } from '@/lib/superadmin'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { email } = await requireSuperAdmin()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-[10px] font-black text-primary-foreground tracking-tight">LX</span>
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Lynkos ID</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Super Admin · SportCore</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{email}</p>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
