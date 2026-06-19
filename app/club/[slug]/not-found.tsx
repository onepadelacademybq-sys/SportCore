import Link from 'next/link'

export default function ClubNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-5xl">🏟️</p>
        <h1 className="text-xl font-semibold">Club no encontrado</h1>
        <p className="text-sm text-muted-foreground">
          El club que buscas no existe o aún no está activo en SportCore.
        </p>
        <Link
          href="https://sportcore.co"
          className="inline-block text-sm text-primary hover:underline"
        >
          Conoce SportCore →
        </Link>
      </div>
    </div>
  )
}
