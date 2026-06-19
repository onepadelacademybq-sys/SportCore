'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth as requireAuthShared } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExerciseState = { error: string | null; success?: string }

export type ExerciseTag = {
  id:   string
  name: string
}

export type Exercise = {
  id:                    string
  created_by:            string
  name:                  string
  theme:                 string
  objective:             string
  level:                 string
  estimated_duration_min: number
  materials:             string[]
  video_url:             string | null
  image_url:             string | null
  instructions:          string | null
  is_published:          boolean
  created_at:            string
  creator:               { id: string; full_name: string } | null
  tags:                  ExerciseTag[]
  is_favorite:           boolean
}

export type ExerciseFilters = {
  theme?:        string
  level?:        string
  search?:       string
  tagId?:        string
  favoritesOnly?: boolean
  maxDuration?:  number
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

async function requireCoachOrAdmin() {
  const ctx = await requireAuthShared()
  if (ctx.role === 'player') redirect('/player/dashboard')
  return ctx
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Lista de ejercicios con filtros opcionales.
 * Admin/coach ven publicados + los suyos propios (borradores).
 */
export async function getExercises(filters: ExerciseFilters = {}): Promise<Exercise[]> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  let query = supabase
    .from('exercises')
    .select(`
      id, created_by, name, theme, objective, level,
      estimated_duration_min, materials, video_url, image_url,
      instructions, is_published, created_at,
      creator:profiles!created_by(id, full_name),
      tags:exercise_tag_assignments(
        tag:exercise_tags!tag_id(id, name)
      )
    `)
    .order('created_at', { ascending: false })

  // Coaches sólo ven publicados + los suyos
  if (role !== 'admin') {
    query = query.or(`is_published.eq.true,created_by.eq.${userId}`)
  }

  if (filters.theme)       query = query.eq('theme', filters.theme)
  if (filters.level)       query = query.eq('level', filters.level)
  if (filters.maxDuration) query = query.lte('estimated_duration_min', filters.maxDuration)
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,objective.ilike.%${filters.search}%`,
    )
  }

  const { data, error } = await query
  if (error) {
    console.error('[getExercises]', error)
    return []
  }

  // Favoritos del usuario actual
  const { data: favData } = await supabase
    .from('exercise_favorites')
    .select('exercise_id')
    .eq('coach_id', userId)

  const favoriteIds = new Set(
    ((favData ?? []) as { exercise_id: string }[]).map((f) => f.exercise_id),
  )

  let exercises = ((data ?? []) as any[]).map((e) => ({
    ...e,
    tags:        (e.tags ?? []).map((t: any) => t.tag).filter(Boolean) as ExerciseTag[],
    is_favorite: favoriteIds.has(e.id),
  }))

  if (filters.favoritesOnly) {
    exercises = exercises.filter((e) => e.is_favorite)
  }
  if (filters.tagId) {
    exercises = exercises.filter((e) =>
      (e.tags as ExerciseTag[]).some((t) => t.id === filters.tagId),
    )
  }

  return exercises as Exercise[]
}

/** Detalle completo de un ejercicio */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const { data, error } = await supabase
    .from('exercises')
    .select(`
      id, created_by, name, theme, objective, level,
      estimated_duration_min, materials, video_url, image_url,
      instructions, is_published, created_at,
      creator:profiles!created_by(id, full_name),
      tags:exercise_tag_assignments(
        tag:exercise_tags!tag_id(id, name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return null

  const e = data as any

  // Borradores sólo visibles al creador o admin
  if (!e.is_published && role !== 'admin' && e.created_by !== userId) return null

  const { data: favData } = await supabase
    .from('exercise_favorites')
    .select('exercise_id')
    .eq('coach_id', userId)
    .eq('exercise_id', id)
    .maybeSingle()

  return {
    ...e,
    tags:        (e.tags ?? []).map((t: any) => t.tag).filter(Boolean) as ExerciseTag[],
    is_favorite: !!favData,
  } as Exercise
}

/** Todos los tags disponibles */
export async function getTags(): Promise<ExerciseTag[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exercise_tags')
    .select('id, name')
    .order('name')
  return (data ?? []) as ExerciseTag[]
}

// ─── Validation ───────────────────────────────────────────────────────────────

const THEMES = [
  'calentamiento', 'tecnica', 'tactica',
  'fisico', 'mental', 'vuelta_a_la_calma',
] as const

const LEVELS = [
  '5ta_masculino', '6ta_masculino', '7ma_masculino',
  'femenino_d', 'femenino_c',
  'juvenil_s18', 'juvenil_s16', 'juvenil_s14',
  'prejuvenil', 'baby_padel',
] as const

const ExerciseUpsertSchema = z.object({
  name:                 z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  theme:                z.enum(THEMES, { error: 'Temática inválida' }),
  objective:            z.string().min(5, 'El objetivo debe tener al menos 5 caracteres'),
  level:                z.enum(LEVELS, { error: 'Nivel inválido' }),
  estimatedDurationMin: z.coerce.number().int().min(1, 'Mínimo 1 minuto').max(180, 'Máximo 180 minutos'),
  materials:            z.string().optional(),
  videoUrl:             z.string().url('URL de video inválida').optional().or(z.literal('')),
  imageUrl:             z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  instructions:         z.string().optional(),
  tagsJson:             z.string().optional(),
})

// ─── Tag helpers ──────────────────────────────────────────────────────────────

async function resolveTagIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tagNames: string[],
): Promise<string[]> {
  const ids: string[] = []
  for (const raw of tagNames) {
    const name = raw.trim().toLowerCase()
    if (!name) continue

    // Try upsert — returns the row whether inserted or pre-existing
    const { data: upserted } = await supabase
      .from('exercise_tags')
      .upsert({ name }, { onConflict: 'name' })
      .select('id')
      .single()

    if (upserted) {
      ids.push((upserted as { id: string }).id)
      continue
    }

    // Fallback: fetch existing
    const { data: existing } = await supabase
      .from('exercise_tags')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) ids.push((existing as { id: string }).id)
  }
  return ids
}

// ─── Crear ejercicio ──────────────────────────────────────────────────────────

export async function createExerciseAction(
  _prev: ExerciseState,
  formData: FormData,
): Promise<ExerciseState> {
  const { supabase, userId, organizationId } = await requireCoachOrAdmin()

  const parsed = ExerciseUpsertSchema.safeParse({
    name:                 formData.get('name'),
    theme:                formData.get('theme'),
    objective:            formData.get('objective'),
    level:                formData.get('level'),
    estimatedDurationMin: formData.get('estimatedDurationMin'),
    materials:            formData.get('materials')    || undefined,
    videoUrl:             formData.get('videoUrl')     || undefined,
    imageUrl:             formData.get('imageUrl')     || undefined,
    instructions:         formData.get('instructions') || undefined,
    tagsJson:             formData.get('tagsJson')     || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const {
    name, theme, objective, level, estimatedDurationMin,
    materials, videoUrl, imageUrl, instructions, tagsJson,
  } = parsed.data

  const isPublished = formData.get('isPublished') === 'true'
  const materialsArr = materials
    ? materials.split(',').map((m) => m.trim()).filter(Boolean)
    : []

  const { data: exercise, error: exerciseErr } = await supabase
    .from('exercises')
    .insert({
      organization_id:        organizationId,
      created_by:             userId,
      name,
      theme,
      objective,
      level,
      estimated_duration_min: estimatedDurationMin,
      materials:              materialsArr,
      video_url:              videoUrl  || null,
      image_url:              imageUrl  || null,
      instructions:           instructions || null,
      is_published:           isPublished,
    })
    .select('id')
    .single()

  if (exerciseErr || !exercise) {
    console.error('[createExerciseAction]', exerciseErr)
    return { error: exerciseErr?.message ?? 'Error al crear el ejercicio.' }
  }

  // Tags
  if (tagsJson) {
    try {
      const tagNames: string[] = JSON.parse(tagsJson)
      const tagIds = await resolveTagIds(supabase, tagNames)
      if (tagIds.length > 0) {
        await supabase.from('exercise_tag_assignments').insert(
          tagIds.map((tagId) => ({
            exercise_id: (exercise as { id: string }).id,
            tag_id: tagId,
          })),
        )
      }
    } catch { /* tags never block the exercise */ }
  }

  revalidatePath('/admin/library')
  revalidatePath('/coach/library')
  return { error: null, success: `Ejercicio "${name}" creado correctamente.` }
}

// ─── Editar ejercicio ─────────────────────────────────────────────────────────

export async function updateExerciseAction(
  _prev: ExerciseState,
  formData: FormData,
): Promise<ExerciseState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const exerciseId = (formData.get('exerciseId') as string | null)?.trim()
  if (!exerciseId) return { error: 'ID de ejercicio requerido' }

  // Permission: admin puede editar cualquiera, coach sólo los suyos
  const { data: existing } = await supabase
    .from('exercises')
    .select('id, created_by')
    .eq('id', exerciseId)
    .single()

  const ex = existing as { id: string; created_by: string } | null
  if (!ex) return { error: 'Ejercicio no encontrado' }
  if (role !== 'admin' && ex.created_by !== userId) {
    return { error: 'Sin permisos para editar este ejercicio' }
  }

  const parsed = ExerciseUpsertSchema.safeParse({
    name:                 formData.get('name'),
    theme:                formData.get('theme'),
    objective:            formData.get('objective'),
    level:                formData.get('level'),
    estimatedDurationMin: formData.get('estimatedDurationMin'),
    materials:            formData.get('materials')    || undefined,
    videoUrl:             formData.get('videoUrl')     || undefined,
    imageUrl:             formData.get('imageUrl')     || undefined,
    instructions:         formData.get('instructions') || undefined,
    tagsJson:             formData.get('tagsJson')     || undefined,
  })

  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const {
    name, theme, objective, level, estimatedDurationMin,
    materials, videoUrl, imageUrl, instructions, tagsJson,
  } = parsed.data

  const isPublished = formData.get('isPublished') === 'true'
  const materialsArr = materials
    ? materials.split(',').map((m) => m.trim()).filter(Boolean)
    : []

  const { error: updateErr } = await supabase
    .from('exercises')
    .update({
      name,
      theme,
      objective,
      level,
      estimated_duration_min: estimatedDurationMin,
      materials:              materialsArr,
      video_url:              videoUrl  || null,
      image_url:              imageUrl  || null,
      instructions:           instructions || null,
      is_published:           isPublished,
    })
    .eq('id', exerciseId)

  if (updateErr) {
    console.error('[updateExerciseAction]', updateErr)
    return { error: updateErr.message ?? 'Error al actualizar el ejercicio.' }
  }

  // Replace all tags
  if (tagsJson !== undefined) {
    await supabase
      .from('exercise_tag_assignments')
      .delete()
      .eq('exercise_id', exerciseId)

    try {
      const tagNames: string[] = JSON.parse(tagsJson)
      const tagIds = await resolveTagIds(supabase, tagNames)
      if (tagIds.length > 0) {
        await supabase.from('exercise_tag_assignments').insert(
          tagIds.map((tagId) => ({ exercise_id: exerciseId, tag_id: tagId })),
        )
      }
    } catch { /* tags never block the update */ }
  }

  revalidatePath('/admin/library')
  revalidatePath('/coach/library')
  revalidatePath(`/admin/library/${exerciseId}`)
  revalidatePath(`/coach/library/${exerciseId}`)
  return { error: null, success: 'Ejercicio actualizado correctamente.' }
}

// ─── Eliminar ejercicio (solo admin) ─────────────────────────────────────────

export async function deleteExerciseAction(
  _prev: ExerciseState,
  formData: FormData,
): Promise<ExerciseState> {
  const { supabase, role } = await requireAuth()
  if (role !== 'admin') return { error: 'Solo los administradores pueden eliminar ejercicios' }

  const exerciseId = (formData.get('exerciseId') as string | null)?.trim()
  if (!exerciseId) return { error: 'ID de ejercicio requerido' }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', exerciseId)

  if (error) {
    console.error('[deleteExerciseAction]', error)
    return { error: error.message ?? 'Error al eliminar el ejercicio.' }
  }

  revalidatePath('/admin/library')
  revalidatePath('/coach/library')
  return { error: null, success: 'Ejercicio eliminado.' }
}

// ─── Toggle favorito ──────────────────────────────────────────────────────────

export async function toggleFavoriteAction(
  _prev: ExerciseState,
  formData: FormData,
): Promise<ExerciseState> {
  const { supabase, userId } = await requireCoachOrAdmin()

  const exerciseId = (formData.get('exerciseId') as string | null)?.trim()
  const isFavorite = formData.get('isFavorite') === 'true'
  if (!exerciseId) return { error: 'ID de ejercicio requerido' }

  if (isFavorite) {
    await supabase
      .from('exercise_favorites')
      .delete()
      .eq('coach_id', userId)
      .eq('exercise_id', exerciseId)
  } else {
    await supabase
      .from('exercise_favorites')
      .insert({ coach_id: userId, exercise_id: exerciseId })
  }

  revalidatePath('/admin/library')
  revalidatePath('/coach/library')
  return { error: null }
}

// ─── Toggle publicar / despublicar ────────────────────────────────────────────

export async function togglePublishAction(
  _prev: ExerciseState,
  formData: FormData,
): Promise<ExerciseState> {
  const { supabase, userId, role } = await requireCoachOrAdmin()

  const exerciseId = (formData.get('exerciseId') as string | null)?.trim()
  if (!exerciseId) return { error: 'ID de ejercicio requerido' }

  const { data: existing } = await supabase
    .from('exercises')
    .select('id, created_by, is_published')
    .eq('id', exerciseId)
    .single()

  const ex = existing as { id: string; created_by: string; is_published: boolean } | null
  if (!ex) return { error: 'Ejercicio no encontrado' }
  if (role !== 'admin' && ex.created_by !== userId) return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('exercises')
    .update({ is_published: !ex.is_published })
    .eq('id', exerciseId)

  if (error) return { error: error.message }

  revalidatePath('/admin/library')
  revalidatePath('/coach/library')
  return {
    error:   null,
    success: ex.is_published ? 'Ejercicio despublicado.' : 'Ejercicio publicado en la biblioteca.',
  }
}
