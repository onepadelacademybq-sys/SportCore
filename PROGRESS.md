# One Padel — Estado del Proyecto

> Última actualización: 2026-05-22

---

## Completado

### Documentación
- `ARCHITECTURE.md` — Stack completo, estructura de directorios, flujo de auth, ADRs, entornos
- `MODULES.md` — 13 módulos con permisos por rol (admin / coach / player)
- `DATABASE.md` — 30 tablas, 29 enums, RLS, índices, triggers planeados

### Base de datos
- Prisma 7 schema (`prisma/schema.prisma`) — 30 modelos, 29 enums
- Migración inicial aplicada: `20260522165058_init_one_padel` (914 líneas SQL — todas las tablas)
- Migración #2 aplicada: `20260522180000_add_profile_document_address` — añade `document_id` y `address` a `profiles`
- Base de datos: Supabase PostgreSQL 16 en `aws-1-sa-east-1`

### Infraestructura de proyecto
- Next.js 15.5 con App Router, TypeScript 5, Turbopack
- Tailwind CSS 4 + shadcn/ui (estilo `base-nova`)
- Componentes shadcn instalados: Button, Card, Input, Label, Alert, Separator
- Librerías: react-hook-form 7, zod 4, @supabase/ssr, Prisma 7
- `.env.local` con credenciales reales, `.env.example` como plantilla, `.gitignore` configurado

### Supabase — Clientes
- `lib/supabase/client.ts` — `createBrowserClient` (Client Components)
- `lib/supabase/server.ts` — `createServerClient` (Server Components, Actions, Route Handlers)
- `lib/supabase/middleware.ts` — helper del middleware (refresca JWT, retorna `{supabase, response, user}`)

### Autenticación y middleware
- `middleware.ts` — autenticación con 3 roles, protección de rutas
  - Rutas públicas: `/login`, `/register`, `/forgot-password`
  - Autenticado sin rol asignado → pasa (perfil aún no creado)
  - Autenticado en ruta pública → redirige a su dashboard
  - Rol incorrecto en prefijo ajeno (`/admin`, `/coach`, `/player`) → redirige a su dashboard
  - Cache de rol en cookie `x-user-role` (httpOnly, 1h TTL) para evitar queries DB en cada request

- `app/(auth)/layout.tsx` — layout centrado con branding "One Padel"
- `app/(auth)/login/page.tsx` — email + contraseña, link a registro y recuperación
- `app/(auth)/register/page.tsx` — 7 campos, rol fijo `player`, manejo de confirmación de email
- `app/(auth)/forgot-password/page.tsx` — envío de email, pantalla de confirmación post-envío
- `actions/auth.ts` — Server Actions: `loginAction`, `registerAction`, `forgotPasswordAction`

---

## Pendiente

### Inmediato — para que el flujo funcione end-to-end
- [ ] `app/page.tsx` — reemplazar default de create-next-app; simplemente redirigir a `/login`
- [ ] `app/(dashboard)/layout.tsx` — shell con sidebar/nav según rol (actualmente passthrough vacío)
- [ ] Dashboards por rol — al menos la página de inicio de cada rol para poder probar el login completo
  - `app/(dashboard)/admin/dashboard/page.tsx`
  - `app/(dashboard)/coach/dashboard/page.tsx`
  - `app/(dashboard)/player/dashboard/page.tsx`

### Base de datos
- [ ] Triggers de base de datos (crear como migración separada):
  - `on_auth_user_created` — crea fila en `profiles` automáticamente al registrar usuario en Supabase Auth
  - `create_session_blocks` — crea los 4 bloques al insertar una `TrainingSession`
  - `update_eval_scores` — recalcula `overall_score` y `normalized_score` al actualizar evaluaciones
- [ ] RLS policies — habilitar y configurar para todas las tablas
- [ ] Supabase custom access token hook — función PostgreSQL que inyecta `role` en `app_metadata` del JWT (habilita la resolución tier-1 en el middleware)
- [ ] `npx supabase gen types typescript --project-id <id>` — reemplazar el stub permisivo en `types/database.types.ts` con tipos reales generados

### Módulos (todos son placeholders vacíos)
- [ ] Módulo 1: Gestión de usuarios (admin)
- [ ] Módulo 2: Reservas de pistas
- [ ] Módulo 3: Pagos (Stripe)
- [ ] Módulo 4: Planificación (Mesociclo → Microciclo → Sesión → 4 bloques)
- [ ] Módulo 5: Evaluaciones con KPIs
- [ ] Módulo 6: Torneos
- [ ] Módulo 7: Notificaciones
- [ ] Módulo 8: Reportes y analytics
- [ ] Módulo 9: Asistencia
- [ ] Módulo 10: Comunicación
- [ ] Módulo 11: Biblioteca de ejercicios
- [ ] Módulo 12: Grupos de entrenamiento
- [ ] Módulo 13: Perfil del entrenador

### Integraciones
- [ ] Stripe — webhooks, pagos de grupos, Stripe Customer Portal
- [ ] Resend — emails transaccionales (confirmación, reset, notificaciones)
- [ ] Sentry — error monitoring
- [ ] Vercel — deploy y variables de entorno en producción

---

## Decisiones técnicas importantes

### Prisma 7 — URL fuera del schema
En Prisma 7, `url` y `directUrl` ya no van en `schema.prisma`. Van en `prisma.config.ts` bajo `datasource.url`. El schema solo tiene `provider = "postgresql"`.

### DIRECT_URL vs DATABASE_URL
- `DATABASE_URL` puerto 6543 — pgBouncer pooled, para queries de runtime (Prisma Client en producción)
- `DIRECT_URL` puerto 5432 — conexión directa, para migraciones (configurado en `prisma.config.ts`)

### Migraciones con advisory lock
`prisma migrate dev` y `prisma migrate resolve` fallan con timeout en este proyecto de Supabase al intentar adquirir `pg_advisory_lock`. **Workaround establecido:** aplicar el SQL directamente con `psql $DIRECT_URL` e insertar el registro manualmente en `_prisma_migrations` via psql. No usar `prisma migrate dev` para futuras migraciones — en su lugar, escribir el SQL manualmente, aplicarlo con psql, e insertar en `_prisma_migrations`.

### Resolución de rol — 3 niveles
```
JWT app_metadata.role  →  cookie x-user-role (1h TTL)  →  query profiles.role
```
El nivel 1 (JWT) está inactivo hasta configurar el custom access token hook en Supabase. Por ahora opera en nivel 3 (DB) la primera vez y nivel 2 (cookie) en requests siguientes.

### Zod v4 instalado
La propiedad de errores es `.issues`, no `.errors`. `ZodError.errors` no existe en Zod 4.

### shadcn form component no disponible
El componente `Form` de shadcn no está disponible con el estilo `base-nova`. Las páginas de auth usan `useActionState` de React 19 con Server Actions — patrón nativo de Next.js 15, sin dependencia del componente Form.

### Registro — perfil vs. trigger
El `registerAction` inserta el perfil manualmente porque el trigger `on_auth_user_created` aún no está creado. Cuando se cree el trigger, la inserción del Server Action se volverá redundante (Supabase la ignorará con `ON CONFLICT DO NOTHING` o se puede eliminar del action).

---

## Siguiente paso exacto

**Construir el shell del dashboard** — es el paso que desbloquea poder probar el flujo completo de login → dashboard.

Orden concreto:
1. Reemplazar `app/page.tsx` con un redirect a `/login`
2. Crear `app/(dashboard)/layout.tsx` con sidebar funcional — navegación diferente por rol (admin / coach / player)
3. Crear las 3 páginas de dashboard mínimas (con un `<h1>` real) para que el middleware tenga a dónde redirigir tras el login

Con eso el flujo completo estará operativo: registro → confirmación email → login → middleware → dashboard de rol.
