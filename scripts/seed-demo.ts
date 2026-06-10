/**
 * Seed de datos demo para presentaciones de venta de SportCore.
 *
 * Crea usuarios, canchas, grupos, reservas, evaluaciones y finanzas realistas.
 *
 * Uso:
 *   npm run seed:demo
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!URL || !KEY) {
  console.error('❌  Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// ─── Credenciales demo ────────────────────────────────────────────────────────

const DEMO = {
  admin:   { email: 'demo.admin@sportcore.app',   password: 'Demo2025Admin!',   name: 'Juan Sedano',         phone: '3016575440' },
  coach1:  { email: 'demo.coach1@sportcore.app',  password: 'Demo2025Coach!',   name: 'Carlos Rodríguez',    phone: '3001234567' },
  coach2:  { email: 'demo.coach2@sportcore.app',  password: 'Demo2025Coach2!',  name: 'Valentina Torres',    phone: '3007654321' },
  player1: { email: 'demo.player1@sportcore.app', password: 'Demo2025Player!',  name: 'Miguel Ángel Pérez',  phone: '3111111111' },
  player2: { email: 'demo.player2@sportcore.app', password: 'Demo2025Player2!', name: 'Laura Martínez',      phone: '3122222222' },
  player3: { email: 'demo.player3@sportcore.app', password: 'Demo2025Player3!', name: 'Santiago Gómez',      phone: '3133333333' },
  player4: { email: 'demo.player4@sportcore.app', password: 'Demo2025Player4!', name: 'Isabella Vargas',     phone: '3144444444' },
  player5: { email: 'demo.player5@sportcore.app', password: 'Demo2025Player5!', name: 'Daniel Castro',       phone: '3155555555' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function col(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function dt(dateStr: string, timeStr: string, offsetH = -5): string {
  return new Date(`${dateStr}T${timeStr}:00${offsetH < 0 ? '-' : '+'}${String(Math.abs(offsetH)).padStart(2, '0')}:00`).toISOString()
}

async function upsertUser(key: keyof typeof DEMO, role: 'admin' | 'coach' | 'player'): Promise<string> {
  const { email, password, name, phone } = DEMO[key]

  // Check if user already exists
  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).single()
  if (existing) {
    console.log(`  ↩  ${role} ${name} ya existe`)
    return existing.id as string
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, phone },
  })
  if (error) throw new Error(`Error creando ${email}: ${error.message}`)

  const userId = data.user.id

  await supabase.from('profiles').upsert({
    id:       userId,
    email,
    full_name: name,
    phone,
    role,
    is_active: true,
    padel_level: role === 'player' ? (
      key === 'player1' ? '7ma_masculino' :
      key === 'player2' ? 'femenino_c' :
      key === 'player3' ? '5ta_masculino' :
      key === 'player4' ? 'juvenil_s16' :
      '6ta_masculino'
    ) : null,
  }, { onConflict: 'id', ignoreDuplicates: true })

  console.log(`  ✓  ${role} ${name} (${email})`)
  return userId
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎾  SportCore — Seed Demo\n')

  // ── 1. Usuarios ─────────────────────────────────────────────────────────────
  console.log('1. Usuarios')
  const adminId   = await upsertUser('admin',   'admin')
  const coach1Id  = await upsertUser('coach1',  'coach')
  const coach2Id  = await upsertUser('coach2',  'coach')
  const player1Id = await upsertUser('player1', 'player')
  const player2Id = await upsertUser('player2', 'player')
  const player3Id = await upsertUser('player3', 'player')
  const player4Id = await upsertUser('player4', 'player')
  const player5Id = await upsertUser('player5', 'player')

  // ── 2. Perfiles de entrenador ────────────────────────────────────────────────
  console.log('\n2. Perfiles de entrenador')
  for (const [coachId, data] of [
    [coach1Id, { bio: 'Entrenador certificado con 8 años de experiencia en pádel competitivo. Especialista en técnica y táctica avanzada.', years: 8, styles: 'Técnico-táctico', levels: ['7ma_masculino','5ta_masculino','6ta_masculino'] }],
    [coach2Id, { bio: 'Coach especialista en formación juvenil y escuelas de iniciación. 5 años acompañando el desarrollo de jugadores jóvenes.', years: 5, styles: 'Formación base', levels: ['juvenil_s16','juvenil_s14','baby_padel'] }],
  ] as const) {
    const { error } = await supabase.from('coach_profiles').upsert({
      coach_id:        coachId,
      bio:             data.bio,
      years_experience: data.years,
      training_style:  data.styles,
      preferred_levels: data.levels,
      hourly_rate_am:  35000,
      hourly_rate_pm:  70000,
      hourly_rate_weekend: 60000,
    }, { onConflict: 'coach_id', ignoreDuplicates: true })
    if (error) console.warn('  ⚠ coach_profile:', error.message)
    else console.log(`  ✓  coach_profile para ${coachId.slice(0, 8)}…`)
  }

  // ── 3. Disponibilidades ──────────────────────────────────────────────────────
  console.log('\n3. Disponibilidades')
  const avail = [
    // Carlos: L-V mañanas (1-5 = lun-vie)
    ...[1,2,3,4,5].map(d => ({ coach_id: coach1Id, day_of_week: d, start_time: '07:00:00', end_time: '14:00:00' })),
    // Valentina: L-V tardes + sábados
    ...[1,2,3,4,5].map(d => ({ coach_id: coach2Id, day_of_week: d, start_time: '14:00:00', end_time: '21:00:00' })),
    { coach_id: coach2Id, day_of_week: 6, start_time: '08:00:00', end_time: '14:00:00' },
  ]
  // Insertar solo si no existen
  for (const a of avail) {
    const { data: ex } = await supabase.from('coach_availability')
      .select('id').eq('coach_id', a.coach_id).eq('day_of_week', a.day_of_week).maybeSingle()
    if (!ex) await supabase.from('coach_availability').insert(a)
  }
  console.log(`  ✓  ${avail.length} franjas de disponibilidad`)

  // ── 4. Canchas ───────────────────────────────────────────────────────────────
  console.log('\n4. Canchas')
  let court1Id: string, court2Id: string
  for (const court of [
    { name: 'Cancha 1', type: 'indoor',  surface: 'cesped_artificial', hourly_rate: 70000 },
    { name: 'Cancha 2', type: 'outdoor', surface: 'cesped_artificial', hourly_rate: 70000 },
  ]) {
    const { data: ex } = await supabase.from('courts').select('id').eq('name', court.name).maybeSingle()
    if (ex) {
      if (court.name === 'Cancha 1') court1Id = ex.id
      else court2Id = ex.id
      console.log(`  ↩  ${court.name} ya existe`)
    } else {
      const { data, error } = await supabase.from('courts').insert({ ...court, status: 'active' }).select('id').single()
      if (error) { console.warn('  ⚠ courts:', error.message); continue }
      if (court.name === 'Cancha 1') court1Id = (data as { id: string }).id
      else court2Id = (data as { id: string }).id
      console.log(`  ✓  ${court.name}`)
    }
  }

  // ── 5. Grupos de entrenamiento ───────────────────────────────────────────────
  console.log('\n5. Grupos de entrenamiento')
  const groupDefs = [
    { name: 'Grupo Élite AM',        coach_id: coach1Id, level: '7ma_masculino',  max_capacity: 6, monthly_fee: 380000, default_court_id: court1Id! },
    { name: 'Grupo Iniciación PM',   coach_id: coach2Id, level: '5ta_masculino',  max_capacity: 6, monthly_fee: 280000, default_court_id: court2Id! },
    { name: 'Juveniles Competitivos',coach_id: coach1Id, level: 'juvenil_s16',    max_capacity: 4, monthly_fee: 220000, default_court_id: court1Id! },
  ]
  const groupIds: Record<string, string> = {}
  for (const g of groupDefs) {
    const { data: ex } = await supabase.from('training_groups').select('id').eq('name', g.name).maybeSingle()
    if (ex) { groupIds[g.name] = ex.id; console.log(`  ↩  "${g.name}" ya existe`); continue }
    const { data, error } = await supabase.from('training_groups').insert({ ...g, status: 'active' }).select('id').single()
    if (error) { console.warn(`  ⚠ groups "${g.name}":`, error.message); continue }
    groupIds[g.name] = (data as { id: string }).id
    console.log(`  ✓  "${g.name}"`)
  }

  // ── 6. Horarios de grupos ────────────────────────────────────────────────────
  console.log('\n6. Horarios de grupos')
  const schedules = [
    { group: 'Grupo Élite AM',         days: [1,3,5], start: '07:00:00', end: '08:30:00' },
    { group: 'Grupo Iniciación PM',    days: [2,4],   start: '15:00:00', end: '16:30:00' },
    { group: 'Juveniles Competitivos', days: [6],     start: '09:00:00', end: '11:00:00' },
  ]
  for (const s of schedules) {
    const gid = groupIds[s.group]
    if (!gid) continue
    const { count } = await supabase.from('group_schedules').select('*', { count: 'exact', head: true }).eq('group_id', gid)
    if ((count ?? 0) > 0) { console.log(`  ↩  horarios "${s.group}" ya existen`); continue }
    for (const day of s.days) {
      await supabase.from('group_schedules').insert({ group_id: gid, day_of_week: day, start_time: s.start, end_time: s.end })
    }
    console.log(`  ✓  horarios "${s.group}"`)
  }

  // ── 7. Miembros de grupos ────────────────────────────────────────────────────
  console.log('\n7. Miembros de grupos')
  const memberships = [
    { group: 'Grupo Élite AM',         player: player1Id },
    { group: 'Grupo Élite AM',         player: player2Id },
    { group: 'Grupo Élite AM',         player: player3Id },
    { group: 'Grupo Iniciación PM',    player: player2Id },
    { group: 'Grupo Iniciación PM',    player: player4Id },
    { group: 'Grupo Iniciación PM',    player: player5Id },
    { group: 'Juveniles Competitivos', player: player4Id },
  ]
  for (const m of memberships) {
    const gid = groupIds[m.group]
    if (!gid) continue
    const { data: ex } = await supabase.from('group_members')
      .select('id').eq('group_id', gid).eq('player_id', m.player).maybeSingle()
    if (ex) continue
    const due = new Date(); due.setMonth(due.getMonth() + 1)
    await supabase.from('group_members').insert({
      group_id: gid,
      player_id: m.player,
      status: 'active',
      payment_status: 'paid',
      monthly_fee_paid_until: due.toISOString().split('T')[0],
    })
  }
  console.log(`  ✓  ${memberships.length} membresías`)

  // ── 8. Reservas individuales ─────────────────────────────────────────────────
  console.log('\n8. Reservas')
  const bookingDefs = [
    // Completadas (pasado)
    { playerId: player1Id, coachId: coach1Id, courtId: court1Id!, date: col(-30), start: '08:00', end: '09:30', status: 'completed', price: 86000 },
    { playerId: player1Id, coachId: coach1Id, courtId: court1Id!, date: col(-23), start: '08:00', end: '09:30', status: 'completed', price: 86000 },
    { playerId: player2Id, coachId: coach1Id, courtId: court2Id!, date: col(-20), start: '09:00', end: '10:30', status: 'completed', price: 86000 },
    { playerId: player3Id, coachId: coach1Id, courtId: court1Id!, date: col(-15), start: '07:00', end: '08:30', status: 'completed', price: 86000 },
    { playerId: player5Id, coachId: coach2Id, courtId: court2Id!, date: col(-10), start: '16:00', end: '17:30', status: 'completed', price: 130000 },
    // Confirmadas (pasado reciente)
    { playerId: player1Id, coachId: coach1Id, courtId: court1Id!, date: col(-5),  start: '08:00', end: '09:30', status: 'confirmed', price: 86000 },
    { playerId: player2Id, coachId: coach2Id, courtId: court2Id!, date: col(-3),  start: '17:00', end: '18:30', status: 'confirmed', price: 130000 },
    // Pendientes de pago (futuro)
    { playerId: player3Id, coachId: coach1Id, courtId: court1Id!, date: col(3),   start: '08:00', end: '09:30', status: 'pending',   price: 86000 },
    { playerId: player4Id, coachId: coach2Id, courtId: court2Id!, date: col(5),   start: '15:00', end: '16:30', status: 'pending',   price: 130000 },
    // Módulo de clases (confirmada)
    { playerId: player1Id, coachId: coach1Id, courtId: court1Id!, date: col(8),   start: '08:00', end: '09:30', status: 'confirmed', price: 640000, moduleClasses: 8 },
  ]

  let bookingCount = 0
  for (const b of bookingDefs) {
    const start = dt(b.date, b.start)
    const end   = dt(b.date, b.end)
    const { data: ex } = await supabase.from('bookings')
      .select('id').eq('player_id', b.playerId).eq('start_time', start).maybeSingle()
    if (ex) continue
    await supabase.from('bookings').insert({
      player_id:     b.playerId,
      coach_id:      b.coachId,
      court_id:      b.courtId,
      created_by:    adminId,
      start_time:    start,
      end_time:      end,
      status:        b.status,
      price:         b.price,
      people_count:  2,
      module_classes: b.moduleClasses ?? null,
    })
    bookingCount++
  }
  console.log(`  ✓  ${bookingCount} reservas nuevas`)

  // ── 9. Wallet de clases ──────────────────────────────────────────────────────
  console.log('\n9. Wallets')
  const wallets = [
    { player_id: player1Id, total_classes: 8, used_classes: 2, available_classes: 6 },
    { player_id: player2Id, total_classes: 0, used_classes: 0, available_classes: 0 },
    { player_id: player3Id, total_classes: 16, used_classes: 6, available_classes: 10 },
  ]
  for (const w of wallets) {
    const { data: ex } = await supabase.from('wallet_balances').select('player_id').eq('player_id', w.player_id).maybeSingle()
    if (!ex) {
      await supabase.from('wallet_balances').insert(w)
      console.log(`  ✓  wallet ${w.player_id.slice(0, 8)}…`)
    } else {
      console.log(`  ↩  wallet ya existe`)
    }
  }

  // ── 10. Transacciones financieras ────────────────────────────────────────────
  console.log('\n10. Finanzas')
  const { count: finCount } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true }).eq('created_by', adminId)
  if ((finCount ?? 0) > 0) {
    console.log('  ↩  transacciones ya existen')
  } else {
    const transactions = [
      // Ingresos de reservas
      { type: 'income',  category: 'booking_income',  amount: 86000,  description: 'Reserva individual AM — Miguel Pérez',    created_by: adminId, transaction_date: col(-30) },
      { type: 'income',  category: 'booking_income',  amount: 86000,  description: 'Reserva individual AM — Miguel Pérez',    created_by: adminId, transaction_date: col(-23) },
      { type: 'income',  category: 'booking_income',  amount: 86000,  description: 'Reserva individual AM — Laura Martínez',  created_by: adminId, transaction_date: col(-20) },
      { type: 'income',  category: 'booking_income',  amount: 130000, description: 'Reserva individual PM — Daniel Castro',   created_by: adminId, transaction_date: col(-10) },
      // Ingresos grupos
      { type: 'income',  category: 'group_fee',       amount: 380000, description: 'Mensualidad Grupo Élite AM — jun 2026',   created_by: adminId, transaction_date: col(-15) },
      { type: 'income',  category: 'group_fee',       amount: 380000, description: 'Mensualidad Grupo Élite AM — jun 2026',   created_by: adminId, transaction_date: col(-14) },
      { type: 'income',  category: 'group_fee',       amount: 280000, description: 'Mensualidad Iniciación PM — jun 2026',    created_by: adminId, transaction_date: col(-12) },
      // Egresos
      { type: 'expense', category: 'court_cost',      amount: 105000, description: 'Costo cancha 1.5h — Grupo Élite AM',     created_by: adminId, transaction_date: col(-30) },
      { type: 'expense', category: 'coach_payment',   amount: 52500,  description: 'Pago coach Carlos Rodríguez — 1.5h AM',  created_by: adminId, transaction_date: col(-30) },
      { type: 'expense', category: 'court_cost',      amount: 105000, description: 'Costo cancha 1.5h — Grupo Élite AM',     created_by: adminId, transaction_date: col(-23) },
      { type: 'expense', category: 'coach_payment',   amount: 52500,  description: 'Pago coach Carlos Rodríguez — 1.5h AM',  created_by: adminId, transaction_date: col(-23) },
    ]
    for (const t of transactions) {
      await supabase.from('financial_transactions').insert(t)
    }
    console.log(`  ✓  ${transactions.length} transacciones`)
  }

  // ── 11. Evaluaciones ─────────────────────────────────────────────────────────
  console.log('\n11. Evaluaciones')
  const { data: evalEx } = await supabase.from('evaluations').select('id').eq('player_id', player1Id).maybeSingle()
  if (evalEx) {
    console.log('  ↩  evaluaciones ya existen')
  } else {
    const evalDate = new Date(col(-20))
    const { data: ev1, error: ev1Err } = await supabase.from('evaluations').insert({
      player_id: player1Id,
      coach_id:  coach1Id,
      eval_date: evalDate.toISOString(),
      notes:     'Jugador con buen potencial. Mejorar posición defensiva y trabajo de piernas.',
    }).select('id').single()

    if (!ev1Err && ev1) {
      // Evaluación técnica básica
      await supabase.from('eval_technical').insert({
        evaluation_id: (ev1 as { id: string }).id,
        drive_technique: 3, backhand_technique: 2, volley_technique: 3,
        smash_technique: 2, lob_technique: 3, bandeja_technique: 2,
        vibora_technique: 1, serve_technique: 3,
      }).select()

      // Evaluación física básica
      await supabase.from('eval_physical').insert({
        evaluation_id: (ev1 as { id: string }).id,
        speed_score: 3, endurance_score: 4, strength_score: 3,
        agility_score: 4, flexibility_score: 2, reaction_score: 4,
      }).select()

      console.log(`  ✓  evaluación completa para Miguel Pérez`)
    } else if (ev1Err) {
      console.warn('  ⚠ evaluación:', ev1Err.message)
    }
  }

  // ── Resumen ──────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(50))
  console.log('✅  Seed completado\n')
  console.log('Credenciales de acceso:')
  console.log('  👤 Admin     →  demo.admin@sportcore.app  /  Demo2025Admin!')
  console.log('  🎾 Entrenador →  demo.coach1@sportcore.app  /  Demo2025Coach!')
  console.log('  🏃 Jugador   →  demo.player1@sportcore.app  /  Demo2025Player!')
  console.log('\nInicia la app con:  npm run dev')
  console.log('Página de demo:     http://localhost:3000/demo\n')
}

main().catch(err => { console.error(err); process.exit(1) })
