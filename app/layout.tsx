import type { Metadata } from 'next'
import { Syne, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const dmMono = DM_Mono({
  variable: '--font-dm-mono',
  subsets: ['latin'],
  weight: ['400'],
})

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
      <body className={`${syne.variable} ${dmSans.variable} ${dmMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
