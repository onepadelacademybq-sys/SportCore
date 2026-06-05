'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Trophy,
  BarChart3,
  Dumbbell,
  ClipboardList,
  Calendar,
  UsersRound,
  BookOpen,
  LayoutList,
  LogOut,
  UserCircle,
  MessageCircle,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { logoutAction } from '@/actions/auth'

const NotificationBell = dynamic(
  () => import('@/components/layout/notification-bell').then((m) => m.NotificationBell),
  { ssr: false },
)

type Role = 'admin' | 'coach' | 'player'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { label: 'Dashboard',  href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Reservas',   href: '/admin/bookings',  icon: Calendar },
    { label: 'Grupos',     href: '/admin/groups',    icon: UsersRound },
    { label: 'Biblioteca',    href: '/admin/library',   icon: BookOpen },
    { label: 'Planificación', href: '/admin/planning',   icon: LayoutList },
    { label: 'Evaluaciones', href: '/admin/evaluations', icon: ClipboardList },
    { label: 'Usuarios',     href: '/admin/users',      icon: Users },
    { label: 'Finanzas',   href: '/admin/finances',  icon: CreditCard },
    { label: 'Torneos',    href: '/admin/tournaments', icon: Trophy },
    { label: 'Reportes',   href: '/admin/reports',   icon: BarChart3 },
    { label: 'CRM',        href: '/admin/crm',        icon: MessageCircle },
  ],
  coach: [
    { label: 'Dashboard',    href: '/coach/dashboard',  icon: LayoutDashboard },
    { label: 'Mis Clases',   href: '/coach/bookings',   icon: Calendar },
    { label: 'Mis Grupos',   href: '/coach/groups',     icon: UsersRound },
    { label: 'Biblioteca',    href: '/coach/library',    icon: BookOpen },
    { label: 'Planificación', href: '/coach/planning',  icon: LayoutList },
    { label: 'Jugadores',     href: '/coach/players',   icon: Users },
    { label: 'Entrenamientos', href: '/coach/trainings', icon: Dumbbell },
    { label: 'Evaluaciones', href: '/coach/evaluations', icon: ClipboardList },
    { label: 'Torneos',      href: '/coach/tournaments', icon: Trophy },
    { label: 'Mi Perfil',    href: '/coach/profile',     icon: UserCircle },
  ],
  player: [
    { label: 'Dashboard',        href: '/player/dashboard',    icon: LayoutDashboard },
    { label: 'Mis entrenamientos', href: '/player/my-trainings', icon: Dumbbell },
    { label: 'Mis evaluaciones', href: '/player/my-evaluations', icon: ClipboardList },
    { label: 'Reservas',         href: '/player/bookings',     icon: Calendar },
    { label: 'Grupos',           href: '/player/groups',       icon: UsersRound },
    { label: 'Torneos',          href: '/player/tournaments',  icon: Trophy },
    { label: 'Mi Perfil',        href: '/player/profile',      icon: UserCircle },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
}

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-red-500/15 text-red-400',
  coach: 'bg-blue-500/15 text-blue-400',
  player: 'bg-[#185FA5]/20 text-[#378ADD]',
}

interface SidebarProps {
  fullName: string
  email: string
  role: Role
}

export function Sidebar({ fullName, email, role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = NAV[role] ?? []
  const [isPending, startTransition] = useTransition()

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5">
        <Link href="/" className="block">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <line x1="50" y1="8"  x2="88" y2="35" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="50" y1="8"  x2="12" y2="35" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="50" y1="8"  x2="50" y2="55" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="88" y1="35" x2="12" y2="35" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="88" y1="35" x2="68" y2="78" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="12" y1="35" x2="32" y2="78" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="32" y1="78" x2="68" y2="78" stroke="#042C53" strokeWidth="2.5"/>
              <line x1="50" y1="55" x2="88" y2="35" stroke="#185FA5" strokeWidth="2"/>
              <line x1="50" y1="55" x2="12" y2="35" stroke="#185FA5" strokeWidth="2"/>
              <line x1="50" y1="55" x2="68" y2="78" stroke="#185FA5" strokeWidth="2"/>
              <line x1="50" y1="55" x2="32" y2="78" stroke="#185FA5" strokeWidth="2"/>
              <line x1="50" y1="8"  x2="32" y2="78" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="4 3"/>
              <line x1="50" y1="8"  x2="68" y2="78" stroke="#378ADD" strokeWidth="1.5" strokeDasharray="4 3"/>
              <circle cx="50" cy="8"  r="5.5" fill="#185FA5"/>
              <circle cx="88" cy="35" r="5.5" fill="#185FA5"/>
              <circle cx="12" cy="35" r="5.5" fill="#042C53"/>
              <circle cx="50" cy="55" r="7"   fill="#185FA5"/>
              <circle cx="32" cy="78" r="5.5" fill="#042C53"/>
              <circle cx="68" cy="78" r="5.5" fill="#185FA5"/>
            </svg>
            <div>
              <p className="text-sm font-bold tracking-tight font-heading leading-none">
                Sport<span className="text-primary">Core</span>
              </p>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5 leading-none">
                by Lynkos ID
              </p>
            </div>
          </div>
        </Link>
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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{fullName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
            <span
              className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[role]}`}
            >
              {ROLE_LABEL[role]}
            </span>
          </div>
          <NotificationBell />
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            await logoutAction()
            router.replace('/login')
          })}
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          {isPending ? 'Saliendo…' : 'Cerrar sesión'}
        </Button>
      </div>
    </aside>
  )
}
