import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Clock, User } from 'lucide-react'
import { getExerciseById, getTags, updateExerciseAction } from '@/actions/exercises'
import { ThemeBadge } from '@/components/exercises/theme-badge'
import { VideoEmbed } from '@/components/exercises/video-embed'
import { FavoriteButton } from '@/components/exercises/favorite-button'
import { PublishButton } from '@/components/exercises/publish-button'
import { DeleteButton } from '@/components/exercises/delete-button'
import { ExerciseForm } from '@/components/exercises/exercise-form'
import { PADEL_LEVEL_LABELS as LEVEL_LABELS } from '@/lib/constants'

export const metadata: Metadata = { title: 'Detalle del Ejercicio — Admin' }

interface PageProps {
  params:      Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}

export default async function AdminExerciseDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  const [exercise, allTags] = await Promise.all([getExerciseById(id), getTags()])
  if (!exercise) notFound()

  const isEditTab = tab === 'edit'

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/admin/library"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Biblioteca
      </Link>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-border">
        {(['detail', 'edit'] as const).map((t) => (
          <Link
            key={t}
            href={`/admin/library/${id}${t === 'edit' ? '?tab=edit' : ''}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              (t === 'edit' ? isEditTab : !isEditTab)
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'edit' ? 'Editar' : 'Detalle'}
          </Link>
        ))}
      </div>

      {isEditTab ? (
        <ExerciseForm action={updateExerciseAction} allTags={allTags} exercise={exercise} />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <ThemeBadge theme={exercise.theme} />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {LEVEL_LABELS[exercise.level] ?? exercise.level}
                </span>
                {!exercise.is_published && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">
                    Borrador
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold">{exercise.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {exercise.estimated_duration_min} min
                </span>
                {exercise.creator && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {exercise.creator.full_name}
                  </span>
                )}
              </div>
            </div>
            <FavoriteButton exerciseId={exercise.id} isFavorite={exercise.is_favorite} />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <PublishButton exerciseId={exercise.id} isPublished={exercise.is_published} />
            <DeleteButton exerciseId={exercise.id} exerciseName={exercise.name} />
          </div>

          {/* Objective */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Objetivo</h2>
            <p className="text-sm">{exercise.objective}</p>
          </section>

          {/* Materials */}
          {exercise.materials.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Material necesario</h2>
              <div className="flex flex-wrap gap-1.5">
                {exercise.materials.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded-md bg-muted text-xs">{m}</span>
                ))}
              </div>
            </section>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">Instrucciones</h2>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{exercise.instructions}</pre>
            </section>
          )}

          {/* Tags */}
          {exercise.tags.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Etiquetas</h2>
              <div className="flex flex-wrap gap-1.5">
                {exercise.tags.map((t) => (
                  <span key={t.id} className="px-2 py-0.5 rounded-full bg-brand/15 text-brand text-xs font-medium">
                    {t.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Video */}
          {exercise.video_url && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Video</h2>
              <VideoEmbed url={exercise.video_url} />
            </section>
          )}

          {/* Image */}
          {exercise.image_url && (
            <section>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exercise.image_url}
                alt={exercise.name}
                className="rounded-lg max-h-80 object-cover"
              />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
