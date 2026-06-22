# SportCore — Sesión de Trabajo 2026-06-22

## Resumen ejecutivo

Sesión de cierre de EPICs y documentación. Se completó el EPIC 6 (billing), se implementó el EPIC 1 P1 (panel super-admin Lynkos), se hizo el commit del acumulado (~50 archivos sin versionar), se eliminaron archivos duplicados y se actualizó `PROGRESS.md` al estado real del proyecto.

---

## 1. Commit de acumulado — limpieza

**Problema:** ~50 archivos de código sin versionar (Sprint 2, Sprint 3, EPIC 6 completos).

**Archivos duplicados eliminados:**
- `actions/reports 2.ts`
- `actions/groups 2.ts`
- `components/crm/lead-detail-drawer 2.tsx`
- `components/crm/user-interactions-panel 2.tsx`
- `components/training/attendance-panel 2.tsx`

**Commit `b99975c`** — 41 archivos, 5,333 inserciones:
- Sprint 2: middleware multi-tenant, `actions/public.ts`, landing pública del club (`/club/[slug]`)
- Sprint 3: calendario de reservas público (`/club/[slug]/book`), `booking-filter-form`, `booking-slot-form`
- Infraestructura: `lib/auth.ts`, migración `add_org_id_to_all_tables`, onboarding
- EPIC 2: `actions/courts.ts` + gestión de espacios con quota
- EPIC 6: `lib/stripe/client.ts` (12 prices), `actions/billing.ts`, `components/billing/billing-dashboard.tsx`, `app/admin/billing/page.tsx`

---

## 2. EPIC 6 — Completado

### Pendiente que se implementó

**`actions/users.ts`** — quota enforcement en dos puntos:

| Función | Quota aplicada |
|---|---|
| `updateUserRole(id, 'coach')` | `assertQuota(orgId, 'coaches')` |
| `updateUserRole(id, 'player')` | `assertQuota(orgId, 'members')` |
| `setUserActive(id, true)` | Lee el rol del usuario → `assertQuota(orgId, 'coaches'/'members')` |

**`lib/quota.ts`** — bug corregido:
```ts
// Antes (contaba recursos de TODAS las orgs):
current = await prisma.court.count()

// Después (filtrado por org):
current = await prisma.court.count({ where: { organizationId } })
```

**Commit `1f91ebd`** — 2 archivos, 28 inserciones.

### Estado final EPIC 6

✅ Infraestructura Stripe (12 price IDs, webhook handler)
✅ `actions/billing.ts` — getBillingStatus, checkout, portal, PLAN_DISPLAY
✅ `components/billing/billing-dashboard.tsx` — plan actual, barras de uso, 4 modalidades
✅ Quota enforcement: resources (courts), members (players), coaches
✅ Sidebar item "Plan" → `/admin/billing`

**Pendiente para producción (no código):**
1. Crear 12 productos en Stripe Dashboard
2. Copiar Price IDs a `.env.local` y Vercel
3. Configurar webhook endpoint + `STRIPE_WEBHOOK_SECRET`

---

## 3. EPIC 1 P1 — Panel super-admin Lynkos

### Arquitectura

- **Guard:** `SUPERADMIN_EMAILS` env var (sin migración de DB, lista separada por comas)
- **Acceso:** cualquier usuario cuyo email esté en la lista puede acceder a `/superadmin`
- **El middleware deja pasar `/superadmin/`** sin bloquear — no encaja en ningún prefijo de rol (`/admin`, `/coach`, `/player`)
- La protección real la ejerce `requireSuperAdmin()` en el layout del route group

### Archivos creados (5)

| Archivo | Descripción |
|---|---|
| `lib/superadmin.ts` | `requireSuperAdmin()` — lee `SUPERADMIN_EMAILS`, redirige si no autorizado |
| `actions/superadmin.ts` | `getSuperAdminData()` con `prisma.organization.findMany` + `prisma.profile.groupBy` para conteos; `updateOrgPlan()`, `updateOrgStatus()` |
| `app/(superadmin)/layout.tsx` | Header mínimo "Lynkos ID · Super Admin", sin sidebar |
| `app/(superadmin)/superadmin/page.tsx` | Server component — carga datos y renderiza el dashboard |
| `components/superadmin/superadmin-dashboard.tsx` | Client component — métricas, filtros, tabla con selects inline |

### Funcionalidades del dashboard

**Métricas (4 cards):**
- Total orgs
- MRR estimado (solo activas × precio mensual base)
- Plan mix (Starter / Pro / Club)
- % conversión de trial (activas / total)

**Tabla de orgs (9 columnas):**
- Nombre + slug | Deporte | Plan (select editable) | Status (select editable) | Miembros | Coaches | Fecha expiración | Fecha creación | Dot Stripe

**Filtros:** búsqueda por nombre/slug + filtro por plan + filtro por status

**Selects inline:** cada fila maneja su propio `useTransition` → cambio de plan/status en tiempo real sin recarga de página

**Commit `ad9e873`** — 5 archivos, 488 inserciones.

---

## 4. Documentación actualizada

- `PROGRESS.md` — reescrito completamente al estado SportCore (era One Padel, 2026-05-28)
  - Infraestructura, migraciones, todos los módulos completados
  - EPIC 6 y EPIC 1 documentados
  - Variables de entorno requeridas (todas las 20)
  - Commits clave
  - Decisiones técnicas importantes
- `sportcore_sesion_2026-06-22.md` — este resumen

---

## 5. Backlog actualizado

| Epic | Descripción | Estado |
|---|---|---|
| EPIC 6 prod | Configurar 12 productos Stripe + webhook | Pendiente (no código) |
| **EPIC 7** | **Seeds por deporte** | **Próximo** |
| EPIC 8 | Onboarding wizard completo | Pendiente |
| Infra | Wildcard `*.sportcore.co` en Vercel | Pendiente (prod) |
| Legal | DNDA + SAS + ToS | Crítica (antes ventas) |
