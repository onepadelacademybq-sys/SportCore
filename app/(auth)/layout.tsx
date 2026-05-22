import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | One Padel',
    default: 'One Padel',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">One Padel</h1>
          <p className="text-muted-foreground text-sm mt-1">Academia de Pádel</p>
        </div>
        {children}
      </div>
    </div>
  )
}
