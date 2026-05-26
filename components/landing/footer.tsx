import Link from 'next/link'

const LINKS = {
  Academia: [
    { label: 'Servicios',  href: '#servicios' },
    { label: 'Precios',    href: '#precios' },
    { label: 'Grupos',     href: '#grupos' },
    { label: 'Nosotros',   href: '#nosotros' },
    { label: 'Contacto',   href: '#contacto' },
  ],
  Plataforma: [
    { label: 'Iniciar sesión', href: '/login' },
    { label: 'Registrarse',    href: '/register' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/10">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 space-y-3">
            <p className="font-heading text-xl font-bold">
              <span className="text-[#00C4CC]">One</span> Padel{' '}
              <span className="text-muted-foreground font-normal text-base">Academy</span>
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              La academia de pádel con metodología de alto rendimiento de Barranquilla, Colombia.
            </p>
            <p className="text-xs text-muted-foreground">
              📍 Barranquilla, Colombia
            </p>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} One Padel Academy. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            onepadelacademybq@gmail.com
          </p>
        </div>
      </div>
    </footer>
  )
}
