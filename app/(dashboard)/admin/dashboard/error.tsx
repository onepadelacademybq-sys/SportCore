'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error)
  }, [error])

  return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
        <h2 className="text-xl font-semibold">Error al cargar el dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Hubo un problema cargando los datos del panel. Intenta de nuevo.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </Button>
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm">Ir a Reservas</Button>
          </Link>
        </div>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground/60 font-mono">{error.digest}</p>
        )}
      </div>
    </div>
  )
}
