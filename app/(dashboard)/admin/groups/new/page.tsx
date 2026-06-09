import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCoaches, getCourts } from '@/actions/bookings'
import { createGroupAction } from '@/actions/groups'
import { GroupForm } from '@/components/groups/group-form'

export const metadata: Metadata = { title: 'Nuevo Grupo — Admin' }

export default async function NewGroupPage() {
  const [coaches, courts] = await Promise.all([getCoaches(), getCourts()])

  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-6">
      <div>
        <Link
          href="/admin/groups"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a grupos
        </Link>
        <h1 className="text-2xl font-bold">Nuevo grupo de entrenamiento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Completa los datos del grupo. Podrás editar todo esto después.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <GroupForm action={createGroupAction} coaches={coaches} courts={courts} />
      </div>
    </div>
  )
}
