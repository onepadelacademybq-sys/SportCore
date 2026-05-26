'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const LINKS = [
  { label: 'Servicios',  href: '#servicios' },
  { label: 'Precios',    href: '#precios' },
  { label: 'Grupos',     href: '#grupos' },
  { label: 'Nosotros',   href: '#nosotros' },
  { label: 'Contacto',   href: '#contacto' },
]

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tracking-tight font-heading">
            <span className="text-[#00C4CC]">One</span> Padel
          </span>
          <span className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-widest border-l border-border pl-2">
            Academy
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 rounded-md bg-[#00C4CC] text-black text-sm font-semibold hover:bg-[#00b3ba] transition-colors"
          >
            Comenzar
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              {l.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2 border-t border-border">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground py-1">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex justify-center items-center px-4 py-2 rounded-md bg-[#00C4CC] text-black text-sm font-semibold hover:bg-[#00b3ba] transition-colors"
            >
              Comenzar
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
