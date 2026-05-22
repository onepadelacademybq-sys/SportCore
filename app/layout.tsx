import type { Metadata } from 'next'
import { Urbanist, Inter } from 'next/font/google'
import './globals.css'

const urbanist = Urbanist({
  variable: '--font-urbanist',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    template: '%s | One Padel',
    default: 'One Padel — Academia de Pádel',
  },
  description: 'Plataforma de gestión para One Padel Academia',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${urbanist.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
