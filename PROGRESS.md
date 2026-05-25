# One Padel — Estado del Proyecto

> Última actualización: 2026-05-25

---

## Completado

### Documentación
- `ARCHITECTURE.md` — Stack completo, estructura de directorios, flujo de auth, ADRs, entornos
- `MODULES.md` — 13 módulos con permisos por rol (admin / coach / player)
- `DATABASE.md` — tablas, enums, RLS, índices, triggers planeados
- `README.md`

### Base de datos
- Prisma 7 schema (`prisma/schema.prisma`) — 30 modelos, enums del Protocolo V3 y reservas
- Base de datos: Supabase PostgreSQL 16 en `aws-1-sa-east-1`
- Migraciones aplicadas (11):
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

### Infraestructura de proyecto
- Next.js 15.5 con App Router, TypeScript 5, Turbopack
- Tailwind CSS 4 + shadcn/ui (estilo `base-nova`)
- Librerías: react-hook-form 7, zod 4, @supabase/ssr, Prisma 7
- `.env.local` con credenciales reales, `.env.example` como plantilla
- `tsc --noEmit` pasa limpio

### Supabase — Clientes
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components)
- `lib/supabase/server.ts` — `createServerClient` (Server Components, Actions, Route Handlers)
- `lib/supabase/middleware.ts` — helper del middleware (refresca JWT, retorna `{supabase, response, user}`)

### Autenticación y middleware
- `middleware.ts` — autenticación con 3 roles, protección de rutas, cache de rol en cookie `x-user-role` (httpOnly, 1h TTL)
- `app/(auth)/layout.tsx` + `login`, `register`, `forgot-password`
- `actions/auth.ts` — `loginAction`, `registerAction`, `forgotPasswordAction`
- `app/page.tsx` — redirige a `/login` o al dashboard del rol según sesión

### Shell de dashboard y dashboards por rol
- `app/(dashboard)/layout.tsx` con sidebar de navegación por rol
- Branding "One Padel Academy"
- Dashboards de inicio: `admin/dashboard`, `coach/dashboard`, `player/dashboard`

### Módulos funcionando

- **Reservas de pistas** (`actions/bookings.ts`, `components/bookings/`)
  - 3 vistas por rol, calendario semanal de disponibilidad por coach
  - Selector de personas y precios en tiempo real
  - Pago con datos bancarios + subida de comprobante como imagen
  - E-wallet como método de pago; selección de paquetes/módulos de clases
  - Cancelación automática de reservas no pagadas en 15 min (contador regresivo, `expires_at`)

- **E-wallet de clases** (`actions/wallet.ts`, `components/finances/`)
  - Saldo siempre visible (0 por defecto), transacciones, `creditClasses` / `debitClass`

- **Planificación** (`actions/training.ts`, `components/training/`)
  - Mesociclo → Microciclo → Sesión → bloques (ahora **3 bloques**: calentamiento 10 / central 35 / vuelta a la calma 15)
  - Mesociclos predefinidos, vinculación a reservas confirmadas
  - Asignación por jugador y por grupo
  - Vistas en admin y coach (`planning/`, `planning/group`, `planning/player`, `session`)

- **Biblioteca de ejercicios** (`actions/exercises.ts`, `components/exercises/`)
  - 19 ejercicios seed de One Padel (`scripts/seed-exercises.ts`)
  - CRUD en admin y coach

- **Grupos de entrenamiento** (`actions/groups.ts`, `components/groups/`)
  - Niveles oficiales One Padel; vistas admin/coach/player

- **Evaluaciones — Protocolo V3** (`actions/evaluations.ts`, `components/evaluations/`)
  - 4 módulos de captura: técnico (checkboxes por golpe), táctico, antropométrico, físico
  - Crear/editar evaluación, notas, compartir con jugador (`shareEvaluation`)
  - Dashboard de evaluación (`eval-dashboard`) con semáforo por grupo técnico
  - **Dashboard de progreso del jugador** (`player/my-evaluations`): resumen general, evolución técnica (gráficos SVG), KPIs por categoría técnica con prioridad, evolución física, evolución antropométrica y lista de evaluaciones compartidas
  - Vista de evolución por jugador para coach/admin (`evaluations/player/[playerId]`)

---

## Pendiente

### Módulos aún en stub (`return null`) — sin Server Actions
- [ ] Gestión de usuarios — `admin/users` (página vacía)
- [ ] Torneos — `admin/tournaments` (`actions/tournaments.ts` vacío)
- [ ] Reportes y analytics — `admin/reports`
- [ ] Finanzas (admin) — `admin/finances` (`actions/finances.ts` vacío)
- [ ] Trainings del coach — `coach/trainings` (página vacía)
- [ ] `actions/trainings.ts` está vacío (duplicado de `training.ts`); decidir si eliminar

### Módulos del roadmap aún no iniciados
- [ ] Notificaciones
- [ ] Comunicación
- [ ] Asistencia
- [ ] Perfil del entrenador

### Base de datos
- [ ] Triggers: `on_auth_user_created`, `create_session_blocks`, `update_eval_scores`
- [ ] RLS policies — habilitar y configurar para todas las tablas
- [ ] Supabase custom access token hook — inyecta `role` en `app_metadata` del JWT (habilita resolución tier-1 en middleware)
- [ ] `npx supabase gen types typescript` — reemplazar el stub permisivo en `types/database.types.ts` con tipos reales (actualmente se castea `supabase as any` en varias actions)

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
- `DIRECT_URL` puerto 5432 — conexión directa, para migraciones (en `prisma.config.ts`)

### Migraciones con advisory lock — aplicar SQL manualmente
`prisma migrate dev` y `prisma migrate resolve` fallan con timeout al adquirir `pg_advisory_lock` en este proyecto de Supabase. **Workaround:** escribir el SQL manualmente, aplicarlo con `psql $DIRECT_URL` e insertar el registro en `_prisma_migrations` vía psql. Las migraciones SQL se escriben idempotentes (ver `change_session_block_type_3_blocks`) para que sean seguras de re-ejecutar.

### Sesiones de entrenamiento — 3 bloques
La estructura pasó de 4 a 3 bloques: `calentamiento` (10 min) / `central` (35 min) / `vuelta_a_la_calma` (15 min). El enum `SessionBlockType` se reemplazó en `20260523120000`; `central_1_defensa` se mapeó a `central` y `central_2_ataque` se eliminó.

### Reservas — pago y cancelación
- Pago con transferencia bancaria: el jugador sube comprobante como imagen; el coach/admin confirma.
- E-wallet de clases como método de pago alternativo; saldo siempre visible (default 0).
- Reservas sin pagar expiran en 15 min (`expires_at`), con contador regresivo y cancelación automática.

### Resolución de rol — 3 niveles
`JWT app_metadata.role → cookie x-user-role (1h TTL) → query profiles.role`. El nivel 1 (JWT) está inactivo hasta configurar el custom access token hook. Por ahora opera en nivel 3 (DB) la primera vez y nivel 2 (cookie) en requests siguientes.

### Tipos de Supabase aún sin generar
`types/database.types.ts` es un stub permisivo. Varias Server Actions castean `supabase as any` para evitar errores de tipo. Se resolverá al correr `supabase gen types`.

### Zod v4
La propiedad de errores es `.issues`, no `.errors`.

### shadcn form component no disponible
El componente `Form` de shadcn no está disponible con `base-nova`. Las páginas usan `useActionState` de React 19 con Server Actions.

### Registro — perfil vs. trigger
`registerAction` inserta el perfil manualmente porque el trigger `on_auth_user_created` aún no existe. Cuando se cree, la inserción del action se vuelve redundante.

---

## Siguiente paso sugerido

Los seis módulos núcleo (reservas, E-wallet, planificación, biblioteca, grupos, evaluaciones) están operativos. Las decisiones de prioridad para lo que sigue:

1. **Limpieza técnica de base de datos** — triggers, RLS y generación de tipos reales eliminan deuda que afecta a todos los módulos.
2. **Completar módulos en stub** — Usuarios (admin), Torneos, Reportes, Finanzas, Trainings del coach.
3. **Integraciones de producción** — Stripe, Resend, Sentry y deploy en Vercel.
