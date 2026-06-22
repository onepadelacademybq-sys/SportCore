import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { UserCircle, AlertCircle } from 'lucide-react'
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
    full_name:     string
    email:         string
    phone:         string | null
    address:       string | null
    document_id:   string | null
    date_of_birth: string | null
  }

  const isIncomplete = !p.phone || !p.document_id || !p.date_of_birth

  return (
    <div className="p-4 md:p-8 max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">Mi Perfil</h1>
          <p className="text-sm text-muted-foreground">{p.email}</p>
        </div>
      </div>

      {isIncomplete && (
        <div className="flex items-start gap-3 rounded-lg border border-[#00C4CC]/30 bg-[#00C4CC]/5 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-[#00C4CC] shrink-0 mt-0.5" />
          <p className="text-sm text-[#00C4CC]">
            Completa tus datos para acceder a todas las funciones de la plataforma.
          </p>
        </div>
      )}

      {/* Campos editables */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Datos personales</h2>
        <EditProfileForm
          action={updateOwnProfileAction}
          initialValues={{
            full_name:     p.full_name,
            phone:         p.phone,
            address:       p.address,
            document_id:   p.document_id,
            date_of_birth: p.date_of_birth,
          }}
        />
      </div>

      {/* Campos ya configurados — solo lectura */}
      {(p.document_id || p.date_of_birth) && (
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
            {p.document_id && (
              <div>
                <p className="text-[11px] text-muted-foreground">Documento</p>
                <p className="text-sm">{p.document_id}</p>
              </div>
            )}
            {p.date_of_birth && (
              <div>
                <p className="text-[11px] text-muted-foreground">Fecha de nacimiento</p>
                <p className="text-sm">{formatDate(`${p.date_of_birth}T12:00:00`)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
