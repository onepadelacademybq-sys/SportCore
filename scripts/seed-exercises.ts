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
  // ── Calentamiento ─────────────────────────────────────────────────────────
  { theme: 'calentamiento', name: 'Movilidad articular dinámica', objective: 'Preparar articulaciones para el esfuerzo', instructions: 'Círculos de tobillos, rodillas, cadera, hombros y muñecas; 30 s cada uno.', duration_minutes: 6 },
  { theme: 'calentamiento', name: 'Activación con desplazamientos', objective: 'Elevar pulsaciones y activar tren inferior', instructions: 'Skipping, talones al glúteo y desplazamientos laterales de pared a pared.', duration_minutes: 7 },
  { theme: 'calentamiento', name: 'Peloteo suave de fondo', objective: 'Entrar en ritmo de golpeo progresivo', instructions: 'Peloteo cooperativo de fondo a media intensidad, subiendo el ritmo gradualmente.', duration_minutes: 8 },

  // ── Físico ────────────────────────────────────────────────────────────────
  { theme: 'fisico', name: 'Escalera de agilidad', objective: 'Mejorar coordinación y frecuencia de pies', instructions: 'Series de entradas en escalera: in-in-out, laterales y carioca.', duration_minutes: 10 },
  { theme: 'fisico', name: 'Pliometría de saltos', objective: 'Desarrollar potencia del tren inferior', instructions: '4 series de 6 saltos al cajón con recuperación completa.', duration_minutes: 12 },
  { theme: 'fisico', name: 'Sprints cortos con cambio de dirección', objective: 'Velocidad y desaceleración específicas de pádel', instructions: '8 sprints de 5 m con frenada y cambio de dirección en cono.', duration_minutes: 10 },

  // ── Táctico ───────────────────────────────────────────────────────────────
  { theme: 'tactica', name: 'Subida a la red coordinada', objective: 'Coordinar la subida en pareja tras saque', instructions: 'La pareja sube junta tras el saque manteniendo la línea; el coach varía la devolución.', duration_minutes: 12 },
  { theme: 'tactica', name: 'Construcción de punto con globo', objective: 'Usar el globo para recuperar la red', instructions: 'Punto en bola viva donde la pareja defensora debe usar el globo para ganar la red.', duration_minutes: 12 },
  { theme: 'tactica', name: 'Posicionamiento defensa-ataque', objective: 'Transición entre roles defensivo y ofensivo', instructions: 'Situaciones de juego donde se alterna defensa y ataque según la bola.', duration_minutes: 12 },

  // ── Mental / Psicológico ──────────────────────────────────────────────────
  { theme: 'mental', name: 'Rutina de concentración pre-punto', objective: 'Establecer una rutina de foco antes de cada punto', instructions: 'Respiración + visualización breve antes de sacar/restar, repetida en cada punto.', duration_minutes: 6 },
  { theme: 'mental', name: 'Puntos de presión simulada', objective: 'Gestionar la presión de puntos decisivos', instructions: 'Jugar puntos arrancando 30-40 para entrenar el manejo de presión.', duration_minutes: 10 },

  // ── Vuelta a la calma ─────────────────────────────────────────────────────
  { theme: 'vuelta_a_la_calma', name: 'Estiramientos estáticos', objective: 'Recuperar y prevenir lesiones', instructions: 'Estiramientos de isquios, cuádriceps, gemelos, hombros y espalda; 30 s cada uno.', duration_minutes: 6 },
  { theme: 'vuelta_a_la_calma', name: 'Respiración y movilidad suave', objective: 'Bajar pulsaciones y relajar', instructions: 'Respiración diafragmática + movilidad articular suave de cierre.', duration_minutes: 5 },

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
    .select('id, organization_id')
    .eq('role', 'admin')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (adminErr || !adminProfile) {
    console.error('❌  No se encontró ningún perfil con role=admin:', adminErr?.message)
    process.exit(1)
  }

  const createdBy      = (adminProfile as { id: string }).id
  const organizationId = (adminProfile as { organization_id: string | null }).organization_id
  console.log(`👤  created_by: ${createdBy}  ·  org: ${organizationId}`)

  // Idempotente: no reinsertar los que ya existen (por nombre, en la org).
  const { data: existingEx } = await supabase
    .from('exercises')
    .select('name')
    .eq('organization_id', organizationId)
  const existingNames = new Set(((existingEx ?? []) as { name: string }[]).map((e) => e.name))

  const rows = EXERCISES.filter((ex) => !existingNames.has(ex.name)).map((ex) => ({
    created_by:             createdBy,
    organization_id:        organizationId,
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

  if (rows.length === 0) {
    console.log('✅  Nada nuevo que insertar (ya están todos).')
    return
  }
  console.log(`📋  ${rows.length} ejercicios nuevos a insertar\n`)

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
