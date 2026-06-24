# Claude Code — Contexto Lynkos SportCore

## Stack
- Next.js 15 App Router + React 19
- Prisma 7 + Supabase (PostgreSQL)
- Tailwind CSS v4 + shadcn/ui + base-ui
- Stripe, Resend, Zod, Zustand
- TypeScript estricto

## Comandos

```bash
npm run dev              # Dev server (Next.js 15 Turbopack)
npm run build            # prisma generate + next build
npm run test             # Vitest
npm run test:watch       # Vitest en modo watch
npm run test:coverage    # Cobertura con v8
npm run lint             # ESLint
npm run seed:sport       # Seed deportes base
npm run seed:exercises   # Seed ejercicios
```

## Arquitectura multi-tenant

- Cada club tiene subdominio: `<slug>.sportcore.co`
- Middleware reescribe a `/club/[slug]` → páginas públicas sin auth
- En dev local: usar `?_org=<slug>` como query param
- Route groups: `(auth)` | `(dashboard)` | `(superadmin)`
- Roles: `admin` | `coach` | `player` — resuelto desde JWT `app_metadata.role` (Tier 1) o `profiles.role` en DB (Tier 2)

## Variables de entorno requeridas

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY       ← NUNCA con prefijo NEXT_PUBLIC_
DATABASE_URL                    ← Prisma connection string
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_APP_URL
```

## Migraciones (workaround Supabase + Prisma)

`prisma migrate dev` falla con advisory lock en Supabase. Workflow correcto:
1. Generar SQL: `prisma migrate diff --to-schema-datamodel prisma/schema.prisma --from-local-db --script > migration.sql`
2. Aplicar vía psql o Supabase SQL Editor
3. Insertar registro en `_prisma_migrations` manualmente

## Skills y cuándo activarlas en este proyecto

### Al tocar la base de datos, migraciones o queries Supabase
Usa `/supabase-postgres-best-practices` antes de escribir cualquier migración, query o política RLS.
El archivo `supabase/rls_policies.sql` está deprecado — contiene solo un aviso de no re-aplicar. Fuente de verdad: migraciones Prisma en orden.

### Antes de implementar features o corregir bugs
Usa `/test-driven-development`. Priorizar cobertura en:
1. `lib/groups/billing.ts` (lógica de mora)
2. `actions/bookings.ts` (pérdida de clases de wallet)

### Al crear o modificar componentes UI
Usa `/frontend-design` y/o `/ui-ux-pro-max`.
Recordar: usar siempre componentes de `components/ui/` (shadcn) en lugar de elementos HTML nativos.
El color de marca usa el token `brand` de Tailwind (definido en `globals.css` como `--brand: #00C4CC`). Usar siempre `text-brand`, `bg-brand`, `border-brand` — nunca `[#00C4CC]` hardcodeado.

### Al revisar Server Actions o lógica de negocio
Usa `/code-reviewer` y `/clean-code`.
Los actions en `actions/` usan `'use server'` — no importar `lib/supabase/admin.ts` desde componentes client.

### Al auditar o reforzar seguridad
Usa `/senior-security`.
Punto crítico: `SUPABASE_SERVICE_ROLE_KEY` nunca debe tener prefijo `NEXT_PUBLIC_`.

### Al diseñar nuevos módulos o refactorizar arquitectura
Usa `/senior-architect`.

### Al escribir tests
Usa `/senior-qa` + Vitest (instalado, `vitest.config.ts` configurado).
Tests en `tests/unit/` — estructura espeja `lib/` y `actions/`.

---

## Convenciones del proyecto

- Server Actions en `actions/` organizados por dominio
- Componentes client con `'use client'` explícito
- Páginas como Server Components que solo obtienen datos y pasan props
- Validación con Zod en todos los actions
- Columnas monetarias: `DECIMAL(10,2)` — nunca floats
- Fechas: siempre `TIMESTAMPTZ` en DB; zona horaria Colombia = UTC-5 sin DST
- **Timezone en render/escritura:** toda fecha en Server Component necesita `timeZone`/offset explícito — nunca confiar en la TZ del runtime (Vercel = UTC). Usar helpers de `lib/format.ts` (`formatSessionDate/Time`, `formatBookingDateTime`, `colombiaLocalToISO`) en vez de `new Date(x).toLocaleString()` o `new Date(naiveLocal)` inline.
- Tests corren con `TZ=UTC` (en los scripts `test*`) para simular Vercel y atrapar bugs de zona que se enmascaran en la máquina local (Colombia).

## Bugs conocidos activos

1. ~~Timezone~~: RESUELTO en `lib/finances/pricing.ts` — usa `CO_OFFSET_MS` + `getUTCDay()` en hora Colombia
2. Race condition en registro: si falla INSERT en `profiles`, usuario queda en Auth sin fila en DB
3. Pérdida de wallet: `debitClass()` se ejecuta antes del INSERT de booking — si falla el INSERT, el jugador pierde clases
