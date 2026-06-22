# SportCore — Sesión de Trabajo 2026-06-22

## Resumen ejecutivo

Sesión de cierre de EPICs pendientes, limpieza del repositorio y documentación completa.
Se versionó el trabajo acumulado de tres sesiones anteriores (~50 archivos), se cerró
el EPIC 6 (billing), se implementó el EPIC 1 P1 (panel super-admin Lynkos), el EPIC 7
(seeds por deporte) y se actualizó toda la documentación del proyecto.

---

## Estado del repo al inicio de sesión

- **Último commit:** `76322ad` — CRM, reportes, RLS global
- **Sin versionar:** ~50 archivos de Sprint 2, Sprint 3 y EPIC 6 completos
- **Archivos duplicados:** 5 archivos con espacio en el nombre (artefactos de macOS)

---

## 1. Commit de acumulado + limpieza (`b99975c`)

### Archivos duplicados eliminados
- `actions/reports 2.ts`
- `actions/groups 2.ts`
- `components/crm/lead-detail-drawer 2.tsx`
- `components/crm/user-interactions-panel 2.tsx`
- `components/training/attendance-panel 2.tsx`

### Contenido del commit — 41 archivos · 5,333 inserciones

**Sprint 2 — Multi-tenant por subdominio:**
- `middleware.ts` — detección de tenant por `slug.sportcore.co` y `?_org=` en dev
- `actions/public.ts` — `getPublicOrg`, `getPublicSlots`, `requestPublicBooking` (adminClient)
- `app/club/[slug]/` — landing pública + not-found + página de reservas

**Sprint 3 — Reservas públicas:**
- `components/club/booking-filter-form.tsx` — selector espacio/fecha (GET form)
- `components/club/booking-slot-form.tsx` — grilla de slots + formulario de contacto
- `app/club/[slug]/book/page.tsx` — página pública de reservas

**Infraestructura multi-tenant:**
- `lib/auth.ts` — `requireAuth()` y `requireRole()` con `organizationId`
- `prisma/migrations/20260618000000_add_org_id_to_all_tables/` — 17 tablas + RLS
- `actions/onboarding.ts` — creación de org con adminClient
- Branding auth pages actualizado de "One Padel" a "SportCore"

**EPIC 2 — Espacios reservables:**
- `actions/courts.ts` — CRUD con tipos cancha/campo/carril/pista/sala + `assertQuota`
- `app/(dashboard)/admin/courts/` — página de gestión
- `components/courts/` — court-form, court-actions-menu, create-court-button

**EPIC 6 — Billing Stripe (primera parte):**
- `lib/stripe/client.ts` — 12 price IDs (4 modalidades × 3 planes)
- `lib/stripe/webhooks.ts` — `PLAN_LIMITS` actualizados, `planFromPriceId()` reescrito
- `actions/billing.ts` — `getBillingStatus`, `createCheckoutSessionAction`, `openBillingPortalAction`, `PLAN_DISPLAY`
- `components/billing/billing-dashboard.tsx` — plan actual, barras de uso, 4 modalidades, 3 plan cards
- `app/(dashboard)/admin/billing/page.tsx` — server component con flash Stripe
- Sidebar: item "Plan" → `/admin/billing`

---

## 2. EPIC 6 — Billing completado (`1f91ebd`)

### Quota enforcement en usuarios

| Función | Evento | Quota verificada |
|---|---|---|
| `updateUserRole(id, 'coach')` | Promover a coach | `assertQuota(orgId, 'coaches')` |
| `updateUserRole(id, 'player')` | Promover a player | `assertQuota(orgId, 'members')` |
| `setUserActive(id, true)` | Reactivar cuenta | Lee rol → `assertQuota` según corresponda |

### Bug corregido — `lib/quota.ts`
```ts
// Antes (contaba resources de TODAS las orgs):
current = await prisma.court.count()

// Después (filtrado por organización):
current = await prisma.court.count({ where: { organizationId } })
```

### Estado final EPIC 6 — ✅ código completo

| Componente | Estado |
|---|---|
| Stripe client + webhooks | ✅ |
| `actions/billing.ts` | ✅ |
| `components/billing/billing-dashboard.tsx` | ✅ |
| Quota: resources | ✅ (courts) |
| Quota: coaches | ✅ (updateUserRole + setUserActive) |
| Quota: members | ✅ (updateUserRole + setUserActive) |
| Panel `/admin/billing` | ✅ |

**Pendiente no-código (antes de producción):**
1. Crear 12 productos en Stripe Dashboard
2. Copiar Price IDs → `.env.local` + Vercel
3. Configurar webhook `https://sportcore.co/api/webhooks/stripe` + `STRIPE_WEBHOOK_SECRET`

---

## 3. EPIC 1 P1 — Panel super-admin Lynkos (`ad9e873`)

### Arquitectura de acceso

- URL: `/superadmin`
- Guard: `requireSuperAdmin()` verifica que `user.email ∈ SUPERADMIN_EMAILS` (env var)
- Sin migración: no requiere columna especial en DB
- El middleware deja pasar `/superadmin/` — no encaja en prefijos `/admin|coach|player`
- La protección real la ejerce el layout del route group `(superadmin)`

### Archivos creados (5)

| Archivo | Descripción |
|---|---|
| `lib/superadmin.ts` | `requireSuperAdmin()` — lee env, redirige si no autorizado |
| `actions/superadmin.ts` | `getSuperAdminData()`, `updateOrgPlan()`, `updateOrgStatus()` |
| `app/(superadmin)/layout.tsx` | Header mínimo "Lynkos ID · Super Admin", sin sidebar |
| `app/(superadmin)/superadmin/page.tsx` | Server component |
| `components/superadmin/superadmin-dashboard.tsx` | Client component completo |

### Funcionalidades

**4 métricas en cards:**
- Total de orgs registradas
- MRR estimado (orgs activas × precio mensual base)
- Plan mix: Starter / Pro / Club
- % conversión de trial (activas / total)

**Tabla de orgs (9 columnas):**

| Columna | Detalle |
|---|---|
| Organización | Nombre + slug |
| Deporte | Sport field de la org |
| Plan | `<select>` editable inline — cambia al instante |
| Estado | `<select>` editable inline — cambia al instante |
| Mbrs / Coaches | Conteo de profiles activos por rol |
| Expira | trialEndsAt o planExpiresAt |
| Creado | createdAt |
| Stripe | Dot verde si tiene stripeSubId |

**Filtros:** búsqueda por nombre/slug · filtro por plan · filtro por status

**Edición en tiempo real:** cada fila usa `useTransition` propio — sin recarga de página

**Configuración local:** `SUPERADMIN_EMAILS=onepadelacademybq@gmail.com` ya en `.env.local`. Agregar en Vercel antes de prod.

---

## 4. Documentación (`9279412`)

### `PROGRESS.md` — reescrito completo

El documento estaba desactualizado (apuntaba a "One Padel", fecha 2026-05-28).
Ahora cubre:

- Visión general del SaaS y métricas de mercado
- Infraestructura Supabase (project ref, URLs, nota IPv6)
- Las 15 migraciones con descripción
- Todos los módulos completados con detalle
- EPIC 6 y EPIC 1 documentados completos
- 20 variables de entorno requeridas con nombres exactos
- Commits clave con hash
- 10 decisiones técnicas importantes (Base UI, Prisma config, RLS, timezone, etc.)

---

## 5. EPIC 7 — Seeds por deporte (`03fd42c`)

### Deportes cubiertos

| Deporte | Recurso | Coach | Player | Horario |
|---|---|---|---|---|
| Pádel | Cancha | Entrenador | Jugador | 08:00–22:00 |
| Tenis | Cancha | Entrenador | Tenista | 07:00–21:00 |
| Fútbol | Campo | Entrenador | Jugador | 07:00–20:00 |
| Natación | Carril | Entrenador | Nadador | 05:00–21:00 |
| Baloncesto | Cancha | Entrenador | Jugador | 08:00–22:00 |

### 9 ejercicios por deporte

| Tema | Cantidad |
|---|---|
| calentamiento | 2 |
| tecnica | 3 |
| tactica | 2 |
| fisico | 1 |
| vuelta_a_la_calma | 1 |

**Total: 45 ejercicios** (9 × 5 deportes)

### Archivos creados (3)

| Archivo | Descripción |
|---|---|
| `lib/seeds/sports.ts` | Definiciones completas de los 5 deportes |
| `actions/seeds.ts` | `seedOrganization(orgId, sport, adminId)` — idempotente |
| `scripts/seed-sport.ts` | CLI para sembrar manualmente |

### Comportamiento de `seedOrganization()`

1. Actualiza `organization.sport` y `organization.terminology`
2. Hace upsert de `academy_settings` con los horarios del deporte
3. Crea los 9 ejercicios **solo si la org no tiene ninguno** (idempotente)
4. Retorna `{ seeded: boolean, exercisesCreated: number }`

### Uso CLI
```bash
npm run seed:sport -- --org=<uuid> --sport=padel --admin=<adminUserId>
```

### Punto de integración — EPIC 8

`seedOrganization()` se llama desde `createOrganizationAction` en el onboarding,
justo después de que la org queda creada en la DB.

---

## Commits de la sesión

| Hash | Descripción |
|---|---|
| `b99975c` | feat: Sprint 2+3 multi-tenant, reservas públicas y EPIC 6 billing Stripe |
| `1f91ebd` | feat(billing): quota enforcement en usuarios y fix count de recursos |
| `ad9e873` | feat(superadmin): EPIC 1 — panel super-admin Lynkos en /superadmin |
| `9279412` | docs: actualizar PROGRESS.md al estado SportCore + resumen sesión |
| `03fd42c` | feat(seeds): EPIC 7 — seeds por deporte |

---

## Backlog actualizado

| Epic | Descripción | Estado |
|---|---|---|
| EPIC 6 prod | Crear 12 productos Stripe + webhook | Pendiente (no-código) |
| **EPIC 8** | **Onboarding wizard completo con selección de deporte + seeds** | **Próximo** |
| Infra | Wildcard `*.sportcore.co` en Vercel | Pendiente (prod) |
| Legal | DNDA SportCore · SAS · ToS/DPA | Crítica (antes ventas) |
