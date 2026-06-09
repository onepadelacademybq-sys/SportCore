import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { EditProfileForm } from '@/components/users/edit-profile-form'
import { updateOwnProfileAction } from '@/actions/users'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Mi Perfil — One Padel' }

export default async function PlayerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, address, document_id, date_of_birth')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const p = profile as {
    full_name: string
    email: string
    phone: string | null
    address: string | null
    document_id: string | null
    date_of_birth: string | null
  }

  return (
    <div className="p-4 md:p-8 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <p className="text-sm text-muted-foreground">{p.email}</p>
        </div>
      </div>

      {/* Campos editables */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Datos personales</h2>
        <EditProfileForm
          action={updateOwnProfileAction}
          initialValues={{
            full_name: p.full_name,
            phone:     p.phone,
            address:   p.address,
          }}
        />
      </div>

      {/* Campos de solo lectura */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Información no editable</h2>
        <p className="text-xs text-muted-foreground">
          Para modificar email, documento o fecha de nacimiento contacta al administrador.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-1">
          <div>
            <p className="text-[11px] text-muted-foreground">Email</p>
            <p className="text-sm">{p.email}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Documento</p>
            <p className="text-sm">{p.document_id ?? '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Fecha de nacimiento</p>
            <p className="text-sm">
              {p.date_of_birth
                ? formatDate(`${p.date_of_birth}T12:00:00`)
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
