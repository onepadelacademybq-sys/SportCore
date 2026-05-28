# One Padel — Estado del Proyecto

> Última actualización: 2026-05-28 — **Aplicación completa, lista para despliegue**

---

## Completado

### Documentación
- `ARCHITECTURE.md` — Stack completo, estructura de directorios, flujo de auth, ADRs, entornos
- `MODULES.md` — 13 módulos con permisos por rol (admin / coach / player)
- `DATABASE.md` — tablas, enums, RLS, índices, triggers planeados
- `README.md`

### Base de datos
- Prisma 7 schema (`prisma/schema.prisma`) — 32 modelos, enums completos incluyendo 8 formatos de torneo
- Base de datos: Supabase PostgreSQL 16 en `aws-1-sa-east-1`
- Migraciones aplicadas (14 formales + 4 manuales vía psql):
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
  - `20260525120000_create_finances_module` — `financial_transactions`, `bank_accounts`, enums financieros
  - `20260526110000_group_members_billing_cycle` — campos de facturación mensual en `group_members`
  - `wallet_transactions.slot_type TEXT` — tipo de clase en cancelaciones
  - *(manual)* `tournaments` — columnas de planta física: `num_courts`, `tournament_date`, `start_time`, `end_time`, `court_cost_total`
  - *(manual)* `TournamentFormat` enum — 5 valores americano: `americano_individual`, `americano_parejas`, `americano_rey_pista`, `super_8`, `americano_mixto`
  - *(manual)* `tournament_entries.is_round_pair BOOLEAN DEFAULT false` — parejas temporales por ronda
  - *(manual)* `tournament_matches.round_number INT`, `court_number INT` — metadatos de ronda/cancha

### Infraestructura de proyecto
- Next.js 15.5 con App Router, TypeScript 5, Turbopack
- Tailwind CSS 4 + shadcn/ui (estilo `base-nova`)
- Librerías: react-hook-form 7, zod 4, @supabase/ssr, Prisma 7
- `.env.local` con credenciales reales, `.env.example` como plantilla
- `tsc --noEmit` pasa limpio en todos los módulos

### Supabase — Clientes y Storage
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components)
- `lib/supabase/server.ts` — `createServerClient` (Server Components, Actions, Route Handlers)
- `lib/supabase/middleware.ts` — helper del middleware (refresca JWT)
- Bucket `payment-proofs` — privado, máx 5 MB, JPEG/PNG/PDF
- Bucket `avatars` — público, máx 5 MB, JPEG/PNG/WEBP + políticas RLS completas

### Autenticación y middleware
- `middleware.ts` — autenticación con 3 roles, protección de rutas, rol resuelto desde DB
- `app/(auth)/layout.tsx` + `login`, `register`, `forgot-password`
- `actions/auth.ts` — `loginAction`, `registerAction`, `forgotPasswordAction`
- `app/page.tsx` — landing pública para no autenticados; redirige al dashboard del rol para sesiones activas

### Shell de dashboard y dashboards por rol
- `app/(dashboard)/layout.tsx` con sidebar de navegación por rol
- **Admin** (`admin/dashboard`): jugadores activos, reservas pendientes, ingresos del mes, próximas reservas, grupos activos
- **Coach** (`coach/dashboard`): jugadores en grupos, sesiones esta semana, evaluaciones incompletas, próxima sesión
- **Jugador** (`player/dashboard`): próxima clase, sesiones completadas, saldo E-wallet, nivel actual, grupos inscritos

---

### Módulos funcionando (todos operativos)

#### Reservas de pistas
- 3 vistas por rol; calendario semanal de disponibilidad por coach
- Selector de personas y precios en tiempo real (AM/PM/FDS)
- Pago con transferencia bancaria + comprobante como imagen; E-wallet como alternativa
- Módulos de 8/16 clases con descuento
- Cancelación automática de reservas no pagadas en 15 min (countdown `expires_at`)
- Cancelación por jugador con crédito a E-wallet (mín. 24 h de anticipación; sin devolución en efectivo)
- **Aviso de política de cancelación** visible en el formulario antes del botón "Solicitar reserva"

#### E-wallet de clases
- Saldo siempre visible (default 0); transacciones AM/PM/FDS/any para trazabilidad

#### Planificación
- Mesociclo → Microciclo → Sesión → 3 bloques (calentamiento 10 / central 35 / vuelta calma 15)
- Asignación por jugador y por grupo; vinculación a reservas confirmadas

#### Biblioteca de ejercicios
- 19 ejercicios seed; CRUD en admin y coach

#### Grupos de entrenamiento
- Inscripción con flujo de pago; cancelación con promoción de lista de espera
- **Facturación de ciclo mensual**: mora 10% tras 4 días de gracia; banners de vencimiento al jugador
- **Agenda de sesiones grupales**: generación automática de bookings `confirmed` al crear el grupo, regeneración manual, `ensureFutureGroupSessions` on-the-fly

#### Evaluaciones — Protocolo V3
- 4 módulos: técnico (checkboxes por golpe), táctico, antropométrico, físico
- Dashboard con semáforo por grupo técnico
- Dashboard de progreso del jugador: evolución técnica (SVG), KPIs, evolución antropométrica y física
- Vista de evolución por jugador para coach/admin

#### Finanzas
- Ledger unificado `financial_transactions`; ingresos/egresos automáticos y manuales
- Egresos automáticos al confirmar reserva: costo de cancha + pago al entrenador por franja
- UI admin: Dashboard (KPIs + flujo de caja semanal + desglose por categoría), Ingresos, Egresos, Cuentas bancarias
- Egreso automático de costo de canchas al iniciar un torneo

#### Gestión de usuarios
- Lista con filtros por rol y búsqueda en tiempo real
- Perfil detallado `admin/users/[id]` con vista bifurcada Jugador/Entrenador
- Cambio de rol y activar/desactivar cuenta

#### Torneos — módulo completo
- **8 formatos**: eliminatoria, grupos (round-robin), grupos + eliminación, americano individual, americano mixto, Super 8, americano por parejas, rey de pista
- **Generación de partidos**:
  - *Eliminatoria*: cuadro de llaves con BYEs, creación de rondas siguientes
  - *Grupos*: round-robin completo
  - *Americano individual / mixto*: rotación greedy minimizando parejas repetidas (múltiplo de 4 jugadores)
  - *Super 8*: calendario fijo de 7 rondas × 2 partidos; cada jugador es pareja de todos los demás exactamente una vez
  - *Americano por parejas*: algoritmo de Berger (round-robin completo de parejas fijas)
  - *Rey de pista*: genera ronda 1 con seed aleatorio; tras cada ronda reagrupa por ranking acumulado (wins → puntos) y reasigna canchas
- **Leaderboard** en tab Resultados: por jugador (formatos `is_round_pair`) o por pareja, con columnas G/P/Pts
- **Planta física**: canchas, horario y costo por franja AM/PM/FDS; análisis déficit/superávit vs. inscripción; egreso automático al iniciar el torneo
- **Formulario de creación**: 8 formatos con descripciones, auto-sugerencia de modalidad de inscripción
- 5 tabs: Información, Planta Física, Inscripciones, Llaves (con badge de cancha C1/C2…), Resultados
- 3 vistas por rol: admin (gestión completa), jugador (inscripción y seguimiento), coach (lectura)

#### Landing page pública
- Información de contacto real: Casa Pádel Barranquilla + link Maps, WhatsApp +57 301 657 5440, Instagram @1padelbaq
- Horario real: Lun–Vie 5–22 h / Sáb–Dom–festivos 8–15 h
- Formulario de contacto funcional → `contact_messages`
- Sección Grupos dinámica con datos reales desde DB

#### Módulo legal
- **`/terms`** — Términos y Condiciones: identificación, reservas/cancelaciones, pagos, grupos, exoneración deportiva, datos personales, propiedad intelectual, modificaciones. Ley colombiana aplicable.
- **`/privacy`** — Política de Privacidad: datos recopilados, finalidad, no venta, derechos ARCO, Ley 1581/2012 + Decreto 1377/2013. Contacto: juansedanotri@gmail.com
- **Login**: texto "Al iniciar sesión aceptas nuestros Términos y Condiciones y Política de Privacidad" con links
- **Registro**: checkbox obligatorio "He leído y acepto…"; botón deshabilitado hasta marcar; links abren en pestaña nueva
- **Formulario de reserva**: aviso de política de cancelación con link "Ver términos completos"
- **Footer**: sección "Legal" con links a ambas páginas

#### Perfil del entrenador
- Formulario editable; subida de foto al bucket `avatars`; certificaciones; KPIs; grilla de disponibilidad

---

## Pendiente / Post-despliegue

### Técnico (bajo impacto en funcionalidad actual)
- [ ] Triggers en DB: `on_auth_user_created`, `create_session_blocks`, `update_eval_scores`
- [ ] RLS global — habilitar y configurar para todas las tablas (solo `storage.objects/avatars` tiene políticas completas)
- [ ] Supabase custom access token hook — inyectar `role` en `app_metadata` del JWT (hoy opera siempre contra la DB)
- [ ] `npx supabase gen types typescript` — reemplazar stub permisivo con tipos reales generados

### Módulos adicionales (no solicitados en esta fase)
- [ ] Reportes y analytics — `admin/reports`
- [ ] Trainings del coach — `coach/trainings`
- [ ] Notificaciones push / in-app
- [ ] Comunicación interna (mensajería)

### Integraciones de producción
- [ ] Vercel — deploy y variables de entorno en producción
- [ ] Dominio personalizado
- [ ] Resend — emails transaccionales (confirmaciones, recordatorios, vencimientos)
- [ ] Sentry — error monitoring
- [ ] Stripe — pagos online (actualmente el flujo es transferencia + verificación manual)

---

## Decisiones técnicas importantes

### Prisma 7 — URL fuera del schema
`url` y `directUrl` van en `prisma.config.ts`, no en `schema.prisma`.

### DIRECT_URL vs DATABASE_URL
- `DATABASE_URL` puerto 6543 — pgBouncer pooled, para queries de runtime
- `DIRECT_URL` puerto 5432 — conexión directa, para migraciones y SQL admin

### Migraciones — aplicar SQL manualmente
`prisma migrate dev` falla con timeout de advisory lock. **Workaround:** SQL manual vía `psql $DIRECT_URL` + insertar registro en `_prisma_migrations`.

### `ALTER TYPE ... ADD VALUE` fuera de transacción
Los nuevos valores de enums PostgreSQL se aplican con sentencias separadas (no pueden ir en bloque transaccional).

### Formatos americano — patrón `is_round_pair`
Los formatos individual/mixto/super_8 crean entradas temporales `tournament_entries` con `is_round_pair=true` por cada ronda, emparejando dos jugadores inscritos individualmente. El leaderboard traza a través de estas entradas para calcular stats por jugador. Las inscripciones reales tienen `is_round_pair=false`.

### Reservas — pago, cancelación y crédito de wallet
- Pago con transferencia bancaria: el jugador sube comprobante; el admin/coach confirma.
- Reservas sin pagar expiran en 15 min (`expires_at`).
- Cancelación por jugador: requiere 24 h; acredita 1 clase AM/PM/FDS; sin devolución en efectivo.

### Facturación de grupos — ciclo mensual y mora
- `cycle_start_date` (próxima clase tras pago), `next_payment_due` (+1 mes), `monthly_fee`, `late_fee_applied`.
- Mora 10% calculada on-the-fly si han pasado > 4 días del vencimiento.

### Resolución de rol — 2 niveles
JWT `app_metadata.role` → query `profiles.role`. El nivel 1 (JWT) está inactivo hasta configurar el custom access token hook.

### Finanzas — egreso de cancha en torneos
`financial_transactions` no tiene FK a torneos. El nombre del torneo se persiste en el campo `description` para trazabilidad.

### Registro — perfil manual (sin trigger)
`registerAction` inserta el perfil manualmente porque el trigger `on_auth_user_created` aún no existe.

### Zod v4
La propiedad de errores es `.issues`, no `.errors`.

### shadcn form component no disponible
Con `base-nova` no está disponible. Las páginas usan `useActionState` de React 19 con Server Actions.
