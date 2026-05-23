'use client'

import { useActionState } from 'react'
import { Heart } from 'lucide-react'
import { toggleFavoriteAction } from '@/actions/exercises'
import { cn } from '@/lib/utils'

interface Props {
  exerciseId: string
  isFavorite: boolean
}

export function FavoriteButton({ exerciseId, isFavorite }: Props) {
  const [, action, isPending] = useActionState(toggleFavoriteAction, { error: null })

  return (
    <form action={action}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="isFavorite" value={String(isFavorite)} />
      <button
        type="submit"
        disabled={isPending}
        title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        className={cn(
          'flex items-center justify-center h-8 w-8 rounded-full transition-colors',
          isFavorite
            ? 'text-rose-400 hover:text-rose-300'
            : 'text-muted-foreground hover:text-rose-400',
          isPending && 'opacity-50',
        )}
      >
        <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
      </button>
    </form>
  )
}
