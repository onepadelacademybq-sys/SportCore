'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[dashboard error]', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>

      <h2 className="text-xl font-semibold mb-2">Algo salió mal</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Ocurrió un error inesperado. Puedes intentar de nuevo o regresar al inicio.
      </p>

      {isDev && error.message && (
        <pre className="mb-6 max-w-lg w-full text-left text-xs bg-muted rounded-lg p-4 overflow-x-auto text-destructive">
          {error.message}
          {error.digest && `\n\nDigest: ${error.digest}`}
        </pre>
      )}

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          Volver
        </Button>
      </div>
    </div>
  )
}
