# SportCore by Lynkos ID — Estado del Proyecto

> Última actualización: **2026-06-19**
> Stack: Next.js 15.5 · TypeScript 5 · Tailwind CSS 4 · Base UI · Supabase PostgreSQL 16 · Prisma 7 · React 19 Server Actions

---

## Visión general

**SportCore** es un SaaS multi-tenant multi-deporte para academias y clubes deportivos en LATAM.
Evolved a partir de `one-padel-app`; repositorio principal: `SportCore`.

| Concepto | Valor |
|---|---|
| Mercado objetivo | ~500 clubes y academias deportivas en Colombia |
| Meta penetración | 30% = 150 clientes |
| Break-even | 95 clientes ($17,955/mes revenue) |
| ARPU real (mix 40/45/15%) | $189 USD/mes |

---

## Infraestructura

### Repositorios
- `https://github.com/onepadelacademybq-sys/one-padel-app` (fetch + push)
- `https://github.com/onepadelacademybq-sys/SportCore` (segundo push — git doble configurado)

### Supabase — proyecto SportCore
| Campo | Valor |
|---|---|
| Project ref | `tpjvfrxqmpioihqsnadw` |
| URL | `https://tpjvfrxqmpioihqsnadw.supabase.co` |
| Región | `aws-1-sa-east-1` (São Paulo) |
| DATABASE_URL (runtime) | Session pooler puerto 6543 con pgBouncer |
| DIRECT_URL (migrations) | Session pooler puerto 5432 sin pgBouncer |

> **Nota:** La IP directa (`db.[ref].supabase.co:5432`) es IPv6-only, no usable desde Mac local. Siempre usar session pooler.

### Migraciones aplicadas (15 total)
| Migración | Descripción |
|---|---|
| `20260522165058_init_one_padel` | Todas las tablas iniciales (32 modelos) |
| `20260522180000_add_profile_document_address` | `document_id`, `address` en profiles |
| `20260522190000_fix_updated_at_defaults` | DEFAULT NOW() + trigger updated_at |
| `20260522200000_bookings_coach_payment` | Campos de pago al coach en reservas |
| `20260522210000_update_padel_level_enum` | Niveles oficiales de pádel |
| `20260523120000_change_session_block_type_3_blocks` | Sesiones pasan de 4 a 3 bloques |
| `20260523130000_add_people_count_to_bookings` | Contador de personas en reservas |
| `20260523140000_add_expires_at_to_bookings` | Soporte cancelación automática |
| `20260523150000_add_module_classes_to_bookings` | Clases por módulo |
| `20260523160000_create_wallet_tables` | E-wallet de clases |
| `20260524100000_create_eval_specialized_tables` | Evaluaciones V3 especializadas |
| `20260525120000_create_finances_module` | Ledger financiero, cuentas bancarias |
| `20260605000000_add_crm_whatsapp` | CRM, leads, interacciones, WhatsApp |
| `20260605000001_add_organizations_rls` | RLS global + función `auth_org_id()` |
| `20260618000000_add_org_id_to_all_tables` | `organization_id` en 17 tablas, multi-tenant completo |

---

## Módulos completados

### Autenticación y multi-tenancy
- `lib/auth.ts` — `requireAuth()` y `requireRole()` con `organizationId`
- `middleware.ts` — detección de tenant por subdominio (`slug.sportcore.co`) + `?_org=` para dev local
- RLS global con `auth_org_id()` en todas las tablas
- `actions/auth.ts` — registro con `adminClient` para bypass de RLS en creación de perfil
- `actions/onboarding.ts` — wizard mínimo de creación de org

### Reservas de espacios
- Calendario semanal con slots de disponibilidad (08:00–22:00, UTC-5 Colombia)
- Pago con transferencia bancaria + comprobante
- E-wallet de clases (AM/PM/FDS/any)
- Cancelación automática a los 15 min (`expires_at`)
- Módulos de 8/16 clases con descuento
- Reservas públicas sin auth vía `/club/[slug]/book`

### Espacios reservables (EPIC 2)
- `actions/courts.ts` — CRUD con tipos: cancha, campo, carril, pista, sala
- `app/(dashboard)/admin/courts/` — página de gestión
- Quota enforcement: `assertQuota('resources')` antes de crear espacio

### Landing pública del club (Sprint 2 + 3)
- `app/club/[slug]/page.tsx` — landing pública del club por subdominio
- `app/club/[slug]/book/page.tsx` — calendario de reservas público
- `actions/public.ts` — queries y mutaciones sin autenticación (adminClient)

### Planificación de entrenamientos
- Jerarquía: Mesociclo → Microciclo → Sesión → 3 bloques
- Asignación por jugador y por grupo
- Biblioteca de ejercicios (CRUD + favoritos + tags + video embed)

### Evaluaciones — Protocolo V3
- 4 módulos: técnico, táctico, antropométrico, físico
- Dashboard con semáforo y evolución SVG
- Compartible con el jugador

### Grupos de entrenamiento
- CRUD + inscripción + lista de espera
- Facturación mensual con mora del 10% a los 4 días
- Generación automática de sesiones grupales

### CRM y retención
- Pipeline de leads (Kanban)
- Interacciones y seguimiento
- Composer de mensajes WhatsApp
- Score de retención de jugadores

### Finanzas
- Ledger unificado `financial_transactions`
- Ingresos/egresos automáticos y manuales
- Dashboard KPIs + flujo de caja semanal
- Cuentas bancarias propias de la org

### Torneos
- 8 formatos: eliminatoria, grupos, grupos+eliminación, americano individual/mixto/parejas, Super 8, rey de pista
- Generación automática de partidos y leaderboard
- Planta física con análisis de costos

### Gestión de usuarios
- Lista con filtros, perfil completo bifurcado (jugador/coach)
- Cambio de rol con quota enforcement (coaches y miembros)
- Activación/desactivación con quota enforcement

### Perfil del coach
- Foto, certificaciones, KPIs, disponibilidad

### Reportes
- Dashboard con métricas por rol

### Módulo legal
- `/terms` — Términos y Condiciones (Ley colombiana)
- `/privacy` — Política de Privacidad (Ley 1581/2012)

### Notificaciones
- Bell in-app con Supabase Realtime

---

## EPIC 6 — Billing SaaS con Stripe ✅

### Planes y precios
| | Starter | Pro | Club |
|---|---|---|---|
| Espacios | 1–3 | 4–7 | 8+ |
| Miembros | 60 | 250 | ∞ |
| Coaches | 2 | 6 | ∞ |
| Mensual | $99 | $199 | $399 |
| Trimestral | $84 | $169 | $339 |
| Anual diferido (18% EA) | $90/mes | $180/mes | $361/mes |
| Anual contado | $990 | $1,990 | $3,990 |

### Implementación
- `lib/stripe/client.ts` — 12 price IDs (4 modalidades × 3 planes), `BillingPlan`, `BillingModality`
- `lib/stripe/webhooks.ts` — `PLAN_LIMITS`, `planFromPriceId()` completo
- `lib/quota.ts` — `assertQuota`, `checkQuota`, `getQuotaSummary` (con filtro `organizationId`)
- `actions/billing.ts` — `getBillingStatus`, `createCheckoutSessionAction`, `openBillingPortalAction`, `PLAN_DISPLAY`
- `actions/courts.ts` — `assertQuota('resources')` antes de crear espacio
- `actions/users.ts` — `assertQuota('coaches'/'members')` en cambio de rol y reactivación
- `components/billing/billing-dashboard.tsx` — plan actual, barras de uso, selector 4 modalidades, 3 plan cards
- `app/(dashboard)/admin/billing/page.tsx` — server component con flash Stripe
- `app/api/webhooks/stripe/route.ts` — webhook handler completo
- Sidebar: item "Plan" → `/admin/billing`

### Pendiente para producción
- [ ] Crear 12 productos/precios en Stripe Dashboard
- [ ] Copiar Price IDs → `.env.local` + Vercel
- [ ] Configurar webhook `https://sportcore.co/api/webhooks/stripe`
- [ ] Agregar `STRIPE_WEBHOOK_SECRET` en Vercel

---

## EPIC 1 — Panel Super-Admin Lynkos ✅

### Acceso
- URL: `/superadmin`
- Guard: `SUPERADMIN_EMAILS` env var (ya configurado en `.env.local`)
- No requiere org asignada, protección independiente del sistema de roles

### Implementación
- `lib/superadmin.ts` — `requireSuperAdmin()` por email
- `actions/superadmin.ts` — `getSuperAdminData()`, `updateOrgPlan()`, `updateOrgStatus()`
- `app/(superadmin)/layout.tsx` — header mínimo "Lynkos ID · Super Admin"
- `app/(superadmin)/superadmin/page.tsx` — server component
- `components/superadmin/superadmin-dashboard.tsx` — métricas + tabla con selects inline

### Funcionalidades
- 4 métricas: total orgs, MRR estimado (solo activas × precio mensual), plan mix, % conversión de trial
- Tabla de orgs: nombre, slug, deporte, plan (editable inline), status (editable inline), miembros, coaches, fecha expiración, dot Stripe
- Filtros: búsqueda por nombre/slug, filtro por plan, filtro por status

---

## Variables de entorno requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=          # puerto 6543 pgBouncer
DIRECT_URL=            # puerto 5432 directo

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_STARTER_QUARTERLY=
STRIPE_PRICE_STARTER_DEFERRED=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_QUARTERLY=
STRIPE_PRICE_PRO_DEFERRED=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_CLUB_MONTHLY=
STRIPE_PRICE_CLUB_QUARTERLY=
STRIPE_PRICE_CLUB_DEFERRED=
STRIPE_PRICE_CLUB_ANNUAL=

# App
NEXT_PUBLIC_APP_URL=https://sportcore.co
SUPERADMIN_EMAILS=onepadelacademybq@gmail.com

# Opcionales
RESEND_API_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
```

---

## Git — commits clave

| Commit | Descripción |
|---|---|
| `76322ad` | feat: CRM completo, reportes, entrenamientos coach, RLS global y trigger auth |
| `b99975c` | feat: Sprint 2+3 multi-tenant, reservas públicas y EPIC 6 billing Stripe |
| `1f91ebd` | feat(billing): quota enforcement en usuarios y fix count de recursos |
| `ad9e873` | feat(superadmin): EPIC 1 — panel super-admin Lynkos en /superadmin |

---

## Backlog

| Epic | Descripción | Prioridad |
|---|---|---|
| EPIC 7 | Seeds por deporte (padel, tenis, fútbol, natación, baloncesto) | Alta |
| EPIC 8 | Onboarding wizard completo con selección de deporte y seeds automáticos | Alta |
| Infra | Wildcard `*.sportcore.co` en Vercel para subdominios | Alta (prod) |
| Legal | Registro DNDA marca SportCore · SAS · ToS/DPA | Crítica (antes ventas) |
| EPIC 6 prod | Configurar 12 productos Stripe + webhook | Crítica (antes ventas) |

---

## Decisiones técnicas importantes

| Decisión | Detalle |
|---|---|
| UI component library | Base UI (`@base-ui/react`), NO Radix. Componentes en `components/ui/`: alert, badge, button, card, input, label, select, separator, textarea. Para overlays: fixed positioning custom (ver `components/crm/create-lead-dialog.tsx`) |
| Prisma config | `url` y `directUrl` en `prisma.config.ts`, no en `schema.prisma` |
| Migraciones | `npx prisma migrate deploy` en SportCore. Advisory lock workaround: psql directo + insertar en `_prisma_migrations` si falla |
| RLS pattern | Escrituras fuera de sesión autenticada → `createAdminClient()` (service role). Incluye: registro de perfil, creación de org, reservas públicas |
| Timezone | Todo en UTC-5 Colombia explícitamente (no depender de TZ del servidor) |
| Passwords en URL | Usar URL encoding para caracteres especiales en connection strings |
| `ALTER TYPE ... ADD VALUE` | Fuera de bloque transaccional (limitación de PostgreSQL) |
| Rol resolution | JWT `app_metadata.role` (Tier 1, inactivo) → query `profiles.role` (Tier 2, activo) |
| `updated_at` | ALTER COLUMN SET DEFAULT NOW() + trigger requerido (Prisma @updatedAt no lo pone automáticamente en Supabase) |
