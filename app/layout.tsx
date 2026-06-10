import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | SportCore',
    default: 'SportCore — Gestión Deportiva · un producto de Lynkos ID',
  },
  description: 'Plataforma SaaS de gestión para academias deportivas. Un producto de Lynkos ID.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
