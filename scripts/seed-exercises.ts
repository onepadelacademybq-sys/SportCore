/**
 * Seed de ejercicios hardcodeados a Supabase.
 *
 * Uso:
 *   npm run seed:exercises
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

// ─── Ejercicios ───────────────────────────────────────────────────────────────

const EXERCISES = [
  // ── Drive simple ──────────────────────────────────────────────────────────
  {
    theme: 'tecnica',
    name: 'conteo drive',
    objective: 'Aprender la mecánica básica de las 3 fases de golpeo del drive',
    instructions: 'Todos los jugadores se pondrán en zona defensiva y realizarán cada una de las fases de golpeo de acuerdo al conteo del entrenador',
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'drive con desplazamiento',
    objective: 'Incorporar todas las fases de golpeo con desplazamiento lateral',
    instructions: 'Los usuarios recorrerán la pista lateralmente entre el cono 1 y el cono 2',
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'punto de contacto simple',
    objective: 'Mejorar el correcto punto de contacto y el control de la bola',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'punto de contacto avanzado',
    objective: 'Mejorar el correcto punto de contacto y el control de bola 2',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'lado a lado drive',
    objective: 'Aprender a desplazarse en velocidad y correcta mecánica para golpear con control',
    instructions: null,
    duration_minutes: 30,
  },

  // ── Reves simple ──────────────────────────────────────────────────────────
  {
    theme: 'tecnica',
    name: 'conteo simple reves',
    objective: 'Aprender la mecánica básica de las 3 fases de golpeo del reves',
    instructions: 'Todos los jugadores se pondrán en zona defensiva y realizarán cada una de las fases de golpeo de acuerdo al conteo del entrenador',
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'reves con desplazamiento',
    objective: 'Incorporar todas las fases de golpeo con desplazamiento lateral',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'punto de contacto simple reves',
    objective: 'Mejorar el correcto punto de contacto y el control de la bola',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'punto de contacto avanzado reves',
    objective: 'Mejorar el correcto punto de contacto y el control de bola 2',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'lado a lado reves',
    objective: 'Aprender a desplazarse en velocidad y correcta mecánica para golpear con control',
    instructions: null,
    duration_minutes: 30,
  },

  // ── Volea de drive simple ─────────────────────────────────────────────────
  {
    theme: 'tecnica',
    name: 'bloqueo basico de volea',
    objective: 'Tener un primer contacto con el juego adelante de la malla',
    instructions: 'Los jugadores se ubicarán cerca de la malla mientras el entrenador lanza bolas suaves con la mano',
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'bloqueo intermedio de volea',
    objective: 'Hacer contacto y enviar la bola fácilmente al lado opuesto',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'conteo simple volea drive',
    objective: 'Aprender la mecánica básica del golpe de volea',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'mecánica de volea rápida',
    objective: 'Aprender a aplicar la mecánica en situaciones de alta presión',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'mecánica de volea con bola pesada',
    objective: 'Aplicar la mecánica en situaciones de alta presión',
    instructions: null,
    duration_minutes: 10,
  },

  // ── Volea de reves simple ─────────────────────────────────────────────────
  {
    theme: 'tecnica',
    name: 'bloqueo basico de volea reves',
    objective: 'Tener un primer contacto con el juego adelante de la malla',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'bloqueo intermedio de volea reves',
    objective: 'Hacer contacto y enviar la bola fácilmente al lado opuesto',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'conteo simple volea reves',
    objective: 'Aprender la mecánica básica del golpe de volea de reves',
    instructions: null,
    duration_minutes: 10,
  },
  {
    theme: 'tecnica',
    name: 'mecánica de volea rápida reves',
    objective: 'Aplicar la mecánica en situaciones de alta presión',
    instructions: null,
    duration_minutes: 10,
  },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Obtener primer admin
  const { data: adminProfile, error: adminErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (adminErr || !adminProfile) {
    console.error('❌  No se encontró ningún perfil con role=admin:', adminErr?.message)
    process.exit(1)
  }

  const createdBy = (adminProfile as { id: string }).id
  console.log(`👤  created_by: ${createdBy}`)
  console.log(`📋  ${EXERCISES.length} ejercicios a insertar\n`)

  const rows = EXERCISES.map((ex) => ({
    created_by:             createdBy,
    name:                   ex.name,
    theme:                  ex.theme,
    level:                  '5ta_masculino',
    objective:              ex.objective,
    instructions:           ex.instructions,
    estimated_duration_min: ex.duration_minutes,
    materials:              [] as string[],
    is_published:           true,
    video_url:              null,
    image_url:              null,
  }))

  const { error } = await supabase.from('exercises').insert(rows)

  if (error) {
    console.error('❌  Error al insertar:', error.message)
    process.exit(1)
  }

  console.log(`✅  ${rows.length} ejercicios insertados correctamente.`)
}

main().catch((err) => {
  console.error('❌  Error inesperado:', err)
  process.exit(1)
})
