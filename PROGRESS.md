# One Padel — Estado del Proyecto

> Última actualización: 2026-05-27

---

## Completado

### Documentación
- `ARCHITECTURE.md` — Stack completo, estructura de directorios, flujo de auth, ADRs, entornos
- `MODULES.md` — 13 módulos con permisos por rol (admin / coach / player)
- `DATABASE.md` — tablas, enums, RLS, índices, triggers planeados
- `README.md`

### Base de datos
- Prisma 7 schema (`prisma/schema.prisma`) — 32 modelos, enums del Protocolo V3, reservas y finanzas
- Base de datos: Supabase PostgreSQL 16 en `aws-1-sa-east-1`
- Migraciones aplicadas (14):
  - `20260522165058_init_one_padel` — todas las tablas iniciales
  - `20260522180000_add_profile_document_address` — `document_id` y `address` en `profiles`
  - `20260522190000_fix_updated_at_defaults`
  - `20260522200000_bookings_coach_payment`
  - `20260522210000_update_padel_level_enum` — niveles oficiales One Padel
  - `20260523120000_change_session_block_type_3_blocks` — sesiones pasan de 4 a 3 bloques
  - `20260523130000_add_people_count_to_bookings`
  - `20260523140000_add_expires_at_to_bookings` — soporte de cancelación automática
  - `20260523150000_add_module_classes_to_bookings`
  - `20260523160000_create_wallet_tables` — E-wallet de clases
  - `20260524100000_create_eval_specialized_tables` — tablas especializadas de evaluación V3
  - `20260525120000_create_finances_module` — `financial_transactions`, `bank_accounts`, enums financieros y tarifas por franja en `coach_profiles`
  - `20260526110000_group_members_billing_cycle` — `cycle_start_date`, `next_payment_due`, `monthly_fee`, `late_fee_applied` en `group_members`; enum `GroupMemberPaymentStatus`
  - `wallet_transactions.slot_type TEXT` — campo para distinguir clase AM/PM/FDS acreditada en cancelaciones

### Infraestructura de proyecto
- Next.js 15.5 con App Router, TypeScript 5, Turbopack
- Tailwind CSS 4 + shadcn/ui (estilo `base-nova`)
- Librerías: react-hook-form 7, zod 4, @supabase/ssr, Prisma 7
- `.env.local` con credenciales reales, `.env.example` como plantilla
- `tsc --noEmit` pasa limpio

### Supabase — Clientes y Storage
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components)
- `lib/supabase/server.ts` — `createServerClient` (Server Components, Actions, Route Handlers)
- `lib/supabase/middleware.ts` — helper del middleware (refresca JWT, retorna `{supabase, response, user}`)
- Bucket `payment-proofs` — privado, máx 5 MB, JPEG/PNG/PDF
- Bucket `avatars` — **público**, máx 5 MB, JPEG/PNG/WEBP + políticas RLS (INSERT/UPDATE/DELETE autenticado por carpeta `uid/`, SELECT público)
- `scripts/create-storage-buckets.ts` — crea/verifica ambos buckets (idempotente)

### Autenticación y middleware
- `middleware.ts` — autenticación con 3 roles, protección de rutas, rol resuelto desde la DB (sin caché de cookie); `'/'` es ruta pública
- `app/(auth)/layout.tsx` + `login`, `register`, `forgot-password`; logos con link a landing
- `actions/auth.ts` — `loginAction`, `registerAction`, `forgotPasswordAction`
- `app/page.tsx` — muestra landing pública para no autenticados; redirige al dashboard del rol para sesiones activas

### Shell de dashboard y dashboards por rol
- `app/(dashboard)/layout.tsx` con sidebar de navegación por rol
- Branding "One Padel Academy"; logo en sidebar enlaza a `/`
- **Dashboards con datos reales** (implementados en esta sesión):
  - **Admin** (`admin/dashboard`): jugadores activos, entrenadores, reservas pendientes de confirmar, ingresos del mes (desde `financial_transactions`), próximas 5 reservas confirmadas, grupos activos con cupos disponibles
  - **Coach** (`coach/dashboard`): jugadores en grupos propios, sesiones esta semana, evaluaciones incompletas, próxima sesión individual, últimas 3 sesiones
  - **Jugador** (`player/dashboard`): próxima clase confirmada, sesiones completadas, saldo E-wallet, nivel actual, últimas 3 reservas, grupos inscritos con estado

### Módulos funcionando

- **Reservas de pistas** (`actions/bookings.ts`, `components/bookings/`)
  - 3 vistas por rol, calendario semanal de disponibilidad por coach
  - Selector de personas y precios en tiempo real
  - Pago con datos bancarios + subida de comprobante como imagen
  - E-wallet como método de pago; selección de paquetes/módulos de clases
  - Cancelación automática de reservas no pagadas en 15 min (contador regresivo, `expires_at`)
  - **Cancelación con crédito de E-wallet** (implementado en esta sesión):
    - Reservas `confirmed`/`paid`: cancela con mínimo 24 h de anticipación
    - Acredita 1 clase del tipo correcto (AM/PM/FDS) según franja horaria
    - `CancelMyBookingButton` con diálogo de confirmación e info del crédito
    - Admin ve badge "Crédito wallet AM/PM/FDS" en reservas canceladas
    - Reservas `pending`: cancelación libre sin crédito (sin pago aún)

- **E-wallet de clases** (`actions/wallet.ts`)
  - Saldo siempre visible (0 por defecto), transacciones, `creditClasses` / `debitClass`
  - `wallet_transactions.slot_type` — distingue créditos AM/PM/FDS/any para trazabilidad

- **Planificación** (`actions/training.ts`, `components/training/`)
  - Mesociclo → Microciclo → Sesión → bloques (3 bloques: calentamiento 10 / central 35 / vuelta a la calma 15)
  - Mesociclos predefinidos, vinculación a reservas confirmadas
  - Asignación por jugador y por grupo
  - Vistas en admin y coach (`planning/`, `planning/group`, `planning/player`, `session`)

- **Biblioteca de ejercicios** (`actions/exercises.ts`, `components/exercises/`)
  - 19 ejercicios seed de One Padel (`scripts/seed-exercises.ts`)
  - CRUD en admin y coach

- **Grupos de entrenamiento** (`actions/groups.ts`, `lib/groups/billing.ts`, `components/groups/`)
  - Niveles oficiales One Padel; vistas admin/coach/player
  - Inscripción con flujo de pago (comprobante + confirmación admin → activación)
  - Cancelación de inscripción con promoción automática de lista de espera
  - Re-inscripción tras cancelar (upsert por `group_id, player_id`)
  - **Facturación de ciclo mensual** (implementado en esta sesión):
    - Campos `cycle_start_date`, `next_payment_due`, `monthly_fee`, `late_fee_applied` en `group_members`
    - `lib/groups/billing.ts` — `calcBilling()` (mora 10% tras 4 días de gracia), `nextClassDate()`, `addOneMonth()`
    - `confirmGroupPaymentAction` calcula el ciclo anclado a la próxima clase tras la confirmación
    - Player: banner de advertencia 2 días antes del vencimiento, banner rojo con monto con mora si vencido
    - Admin: pestaña "Facturación" por grupo con estado por jugador (Al día / Vence en Xd / Vencido con mora)
  - **Agenda de sesiones grupales** (implementado en esta sesión):
    - `generateGroupSessions` — crea automáticamente sesiones de los meses actual y siguiente al crear el grupo (bookings `confirmed` con `group_id`, bloquea el calendario del entrenador)
    - `generateGroupSessionsAction` — regeneración manual desde el admin
    - `getGroupSessions` / `getUpcomingGroupSessions` — listados para admin/coach/player
    - `confirmGroupSessionAction` / `cancelGroupSessionAction` — gestión individual
    - `ensureFutureGroupSessions` — genera el mes siguiente on-the-fly cuando quedan < 14 días
    - `lib/groups/billing.ts` expone helpers de fechas usados por las acciones

- **Evaluaciones — Protocolo V3** (`actions/evaluations.ts`, `components/evaluations/`)
  - 4 módulos de captura: técnico (checkboxes por golpe), táctico, antropométrico, físico
  - Crear/editar evaluación, notas, compartir con jugador (`shareEvaluation`)
  - Dashboard de evaluación (`eval-dashboard`) con semáforo por grupo técnico
  - Dashboard de progreso del jugador (`player/my-evaluations`): resumen general, evolución técnica (gráficos SVG), KPIs por categoría técnica con prioridad, evolución física, evolución antropométrica y lista de evaluaciones compartidas
  - Vista de evolución por jugador para coach/admin (`evaluations/player/[playerId]`)

- **Finanzas** (`actions/finances.ts`, `lib/finances/`, `components/finances/`, `admin/finances`)
  - Libro unificado `financial_transactions` (ledger): ingresos y egresos con categoría, FK a reserva/grupo/cuenta
  - Ingresos automáticos: reservas confirmadas (`booking_income`) y pagos de grupos por delta (`group_income`)
  - Egresos automáticos al confirmar reserva: costo de cancha $70.000/h (`court_cost`) y pago al entrenador prorrateado por franja AM/PM/fin de semana (`coach_payment`)
  - Ingresos/egresos manuales; cuentas bancarias con saldo (`bank_accounts`, CRUD)
  - UI admin con 4 pestañas: Dashboard (KPIs del mes + flujo de caja semanal + desglose por categoría), Ingresos, Egresos (+ egreso manual), Cuentas bancarias

- **Gestión de usuarios** (`actions/users.ts`, `components/users/`, `admin/users/`)
  - Lista con filtros por rol (Todos / Admins / Entrenadores / Jugadores) y búsqueda en tiempo real
  - Perfil detallado `admin/users/[id]` con vista bifurcada por rol:
    - **Jugador/Admin**: comportamiento de pago, últimas 5 reservas, grupos inscritos, evaluaciones, planificaciones, E-wallet
    - **Entrenador**: clases impartidas, mesociclos creados, próximas clases (tareas pendientes), jugadores asignados actualmente
  - Sidebar con acciones admin: cambio de rol y activar/desactivar cuenta (service-role client)

- **Landing page pública** (`app/page.tsx`, `components/landing/`, `actions/contact.ts`)
  - Nav sticky con links de grupos en el menú
  - Misión / Visión / Valores con texto oficial de marca
  - Precios oficiales: sesiones AM ($86k), PM ($130k), FDS ($138k); módulos 8/16 clases con badge de ahorro; tabla Trío/Cuarteto; banner de transparencia
  - Sección Grupos dinámica: server component que consume `training_groups` activos con coach, horarios y cupos en tiempo real; estado vacío si no hay grupos
  - Sección de contacto + formulario funcional → tabla `contact_messages`

- **Perfil del entrenador** (`actions/coach-profile.ts`, `lib/coach-constants.ts`, `components/coach/`, `coach/profile`)
  - Formulario editable: nombre, teléfono, bio, años de experiencia, fortalezas, niveles preferidos, estilo, idiomas
  - Subida de foto de perfil al bucket `avatars`
  - Certificaciones con badge "Validada" y eliminación segura
  - 5 KPI cards de actividad; grilla de disponibilidad semanal

---

## Pendiente

### Módulos aún en stub o sin implementar
- [ ] Torneos — `admin/tournaments` (`actions/tournaments.ts` vacío)
- [ ] Reportes y analytics — `admin/reports`
- [ ] Trainings del coach — `coach/trainings` (página vacía)
- [ ] `actions/trainings.ts` está vacío (duplicado de `training.ts`); decidir si eliminar
- [ ] Notificaciones
- [ ] Comunicación
- [ ] Agenda de grupos — vistas para coach (`/coach/groups`) y player (`/player/groups` sección sesiones)

### Base de datos
- [ ] Triggers: `on_auth_user_created`, `create_session_blocks`, `update_eval_scores`
- [ ] RLS policies — habilitar y configurar para todas las tablas (solo `storage.objects/avatars` tiene políticas completas)
- [ ] Supabase custom access token hook — inyecta `role` en `app_metadata` del JWT
- [ ] `npx supabase gen types typescript` — reemplazar el stub permisivo en `types/database.types.ts` con tipos reales

### Integraciones
- [ ] Stripe — webhooks, pagos de grupos, Customer Portal
- [ ] Resend — emails transaccionales
- [ ] Sentry — error monitoring
- [ ] Vercel — deploy y variables de entorno en producción

---

## Decisiones técnicas importantes

### Prisma 7 — URL fuera del schema
`url` y `directUrl` van en `prisma.config.ts` bajo `datasource.url`, no en `schema.prisma`. El schema solo tiene `provider = "postgresql"`.

### DIRECT_URL vs DATABASE_URL
- `DATABASE_URL` puerto 6543 — pgBouncer pooled, para queries de runtime
- `DIRECT_URL` puerto 5432 — conexión directa, para migraciones y SQL admin (`psql $DIRECT_URL`)

### Migraciones con advisory lock — aplicar SQL manualmente
`prisma migrate dev` y `prisma migrate resolve` fallan con timeout. **Workaround:** escribir el SQL manualmente, aplicarlo con `psql $DIRECT_URL` e insertar el registro en `_prisma_migrations` vía psql.

### Sesiones de entrenamiento — 3 bloques
La estructura pasó de 4 a 3 bloques: `calentamiento` (10 min) / `central` (35 min) / `vuelta_a_la_calma` (15 min).

### Reservas — pago, cancelación y crédito de wallet
- Pago con transferencia bancaria: el jugador sube comprobante como imagen; el coach/admin confirma.
- E-wallet de clases como método de pago alternativo; saldo siempre visible (default 0).
- Reservas sin pagar expiran en 15 min (`expires_at`), con contador regresivo y cancelación automática.
- Cancelación de reservas `confirmed`/`paid` por el jugador: requiere 24 h de anticipación; acredita 1 clase del tipo AM/PM/FDS a la wallet; sin devolución en efectivo.
- `wallet_transactions.slot_type` persiste el tipo de clase para trazabilidad.

### Facturación de grupos — ciclo mensual y mora
- Campos en `group_members`: `cycle_start_date` (próxima clase tras pago confirmado), `next_payment_due` (+1 mes), `monthly_fee`, `late_fee_applied`.
- `lib/groups/billing.ts` calcula mora on-the-fly: 10% si han pasado > 4 días del vencimiento.
- `late_fee_applied=true` solo se escribe en DB cuando el admin confirma un pago tardío.
- Las sesiones del grupo se generan como bookings `confirmed` (no `pending`) para bloquear el calendario del entrenador en `getCoachAvailability`.

### Resolución de rol — 2 niveles (sin caché de cookie)
`JWT app_metadata.role → query profiles.role`. El nivel 1 (JWT) está inactivo hasta configurar el custom access token hook, así que hoy opera siempre contra la DB.

### Constantes de coach separadas de las server actions
`lib/coach-constants.ts` — Next.js no permite exportar objetos desde archivos con `'use server'` (solo async functions).

### Storage — políticas RLS de avatars
El bucket `avatars` es público para lectura pero requiere políticas RLS explícitas en `storage.objects` para INSERT/UPDATE/DELETE. Las políticas validan que el primer segmento del path coincida con `auth.uid()`.

### Zod v4
La propiedad de errores es `.issues`, no `.errors`.

### shadcn form component no disponible
El componente `Form` de shadcn no está disponible con `base-nova`. Las páginas usan `useActionState` de React 19 con Server Actions.

### Registro — perfil vs. trigger
`registerAction` inserta el perfil manualmente porque el trigger `on_auth_user_created` aún no existe.

### Finanzas — ledger y tarifas del entrenador
- `financial_transactions` es un libro unificado. El dashboard, listados y flujo de caja leen de esta tabla.
- Tarifas del entrenador por franja en `coach_profiles`; el pago se prorratea en `lib/finances/pricing.ts`.
- `recordBookingFinancials` es idempotente; el ingreso de grupo se registra por **delta** para evitar doble conteo.

---

## Siguiente paso sugerido

Once módulos/secciones operativos. Prioridades sugeridas:

1. **Vistas de agenda de grupos** — pestaña Agenda en admin/groups/[id], sesiones en coach/groups y player/groups.
2. **Limpieza técnica de base de datos** — triggers, RLS global y generación de tipos reales.
3. **Módulos pendientes** — Torneos, Reportes, Trainings del coach.
4. **Integraciones de producción** — Stripe, Resend, Sentry y deploy en Vercel.
