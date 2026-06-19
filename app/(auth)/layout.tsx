import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: {
    template: '%s | SportCore',
    default: 'SportCore',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight font-heading">
              <span className="text-primary">Sport</span>Core
            </h1>
            <p className="text-muted-foreground text-xs tracking-widest uppercase mt-1">
              Gestión Deportiva
            </p>
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
