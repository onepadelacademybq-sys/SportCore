import type { Metadata } from 'next'
import { getUsers } from '@/actions/users'
import { UsersList } from '@/components/users/users-list'

export const metadata: Metadata = { title: 'Usuarios — Admin' }

export default async function AdminUsersPage() {
  const users = await getUsers()

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión de cuentas, roles y perfiles de la academia
        </p>
      </div>

      <UsersList users={users} />
    </div>
  )
}
