'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 mx-auto">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>

          <h1 className="text-xl font-semibold mb-2">Error inesperado</h1>
          <p className="text-sm text-muted-foreground mb-6">
            No se pudo cargar la página. Por favor intenta de nuevo.
          </p>

          {isDev && error.message && (
            <pre className="mb-6 text-left text-xs bg-muted rounded-lg p-4 overflow-x-auto text-destructive">
              {error.message}
            </pre>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Intentar de nuevo
            </button>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
