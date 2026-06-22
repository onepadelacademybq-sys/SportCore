export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      {/* Título */}
      <div className="h-8 w-48 rounded-lg bg-muted" />

      {/* KPI cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-7 w-24 rounded bg-muted" />
            <div className="h-2 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wide card */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-2 w-1/2 rounded bg-muted" />
                </div>
                <div className="h-5 w-16 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Narrow card */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
