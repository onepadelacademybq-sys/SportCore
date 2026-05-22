'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Trophy,
  BarChart3,
  Dumbbell,
  ClipboardList,
  Calendar,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { logoutAction } from '@/actions/auth'

type Role = 'admin' | 'coach' | 'player'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Usuarios', href: '/admin/users', icon: Users },
    { label: 'Finanzas', href: '/admin/finances', icon: CreditCard },
    { label: 'Torneos', href: '/admin/tournaments', icon: Trophy },
    { label: 'Reportes', href: '/admin/reports', icon: BarChart3 },
  ],
  coach: [
    { label: 'Dashboard', href: '/coach/dashboard', icon: LayoutDashboard },
    { label: 'Jugadores', href: '/coach/players', icon: Users },
    { label: 'Entrenamientos', href: '/coach/trainings', icon: Dumbbell },
    { label: 'Evaluaciones', href: '/coach/evaluations', icon: ClipboardList },
  ],
  player: [
    { label: 'Dashboard', href: '/player/dashboard', icon: LayoutDashboard },
    { label: 'Mis entrenamientos', href: '/player/my-trainings', icon: Dumbbell },
    { label: 'Mis evaluaciones', href: '/player/my-evaluations', icon: ClipboardList },
    { label: 'Reservas', href: '/player/bookings', icon: Calendar },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
}

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-red-100 text-red-700',
  coach: 'bg-blue-100 text-blue-700',
  player: 'bg-green-100 text-green-700',
}

interface SidebarProps {
  fullName: string
  email: string
  role: Role
}

export function Sidebar({ fullName, email, role }: SidebarProps) {
  const pathname = usePathname()
  const navItems = NAV[role] ?? []

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-6">
        <p className="text-lg font-bold tracking-tight">One Padel</p>
        <p className="text-xs text-muted-foreground">Academia de Pádel</p>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User info + logout */}
      <div className="p-4 space-y-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <span
            className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}
          >
            {ROLE_LABEL[role]}
          </span>
        </div>
        <form action={logoutAction}>
          <Button
            variant="outline"
            size="sm"
            type="submit"
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  )
}
