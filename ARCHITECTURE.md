# ARCHITECTURE.md — One Padel Academy

## Visión General

One Padel es una aplicación web SaaS para la gestión integral de una academia de pádel. Soporta tres roles de usuario (Administrador, Entrenador, Jugador) con módulos de reservas, entrenamientos, finanzas, torneos y evaluaciones.

---

## Stack Tecnológico

### Razón de las elecciones

| Criterio | Decisión |
|---|---|
| Equipo pequeño, velocidad de desarrollo | Full-stack unificado con Next.js |
| Seguridad por rol a nivel de base de datos | Supabase RLS (Row Level Security) |
| Tiempo real (reservas, notificaciones) | Supabase Realtime |
| Pagos y suscripciones | Stripe |
| Evitar infraestructura propia de auth | Supabase Auth |

---

### Frontend

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 15 (App Router) | Framework principal, SSR + RSC |
| **TypeScript** | 5.x | Tipado estático en todo el proyecto |
| **Tailwind CSS** | 4.x | Estilos utilitarios |
| **shadcn/ui** | latest | Componentes accesibles (Radix UI) |
| **TanStack Query** | 5.x | Caché y sincronización de datos cliente |
| **Zustand** | 5.x | Estado global ligero (UI state) |
| **React Hook Form + Zod** | latest | Formularios + validación de esquemas |
| **Recharts** | 2.x | Gráficas para finanzas y analytics |
| **FullCalendar** | 6.x | Vista de calendario para reservas |

### Backend

| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js API Routes** | 15 | Endpoints REST internos y webhooks |
| **Next.js Server Actions** | 15 | Mutaciones del lado servidor |
| **Supabase** | latest | BaaS: DB, Auth, Storage, Realtime |
| **Prisma** | 5.x | ORM con tipado, migraciones y seeds |
| **Zod** | 3.x | Validación de entrada en API Routes |

### Base de Datos

| Tecnología | Rol |
|---|---|
| **PostgreSQL 16** (via Supabase) | Base de datos principal relacional |
| **Supabase RLS** | Seguridad por fila según rol del usuario |
| **Supabase Realtime** | Subscripciones en vivo (reservas, torneos) |
| **Redis** (Upstash) | Caché de sesiones, rate limiting, locks de reserva |

### Autenticación y Autorización

| Tecnología | Rol |
|---|---|
| **Supabase Auth** | Registro, login, refresh tokens, JWT |
| **Custom Claims (JWT)** | Rol del usuario embebido en el token |
| **Middleware Next.js** | Protección de rutas por rol en el servidor |
| **RLS Policies** | Autorización a nivel de base de datos |

Flujo de roles: `supabase.auth.users` → tabla `profiles` con campo `role: 'admin' | 'coach' | 'player'` → claim en JWT → middleware Next.js → RLS policy.

### Servicios Externos

| Servicio | Propósito |
|---|---|
| **Stripe** | Pagos, suscripciones mensuales, facturas |
| **Resend** | Emails transaccionales (confirmaciones, recordatorios) |
| **Supabase Storage** | Avatares, documentos, vídeos de evaluación |
| **Vercel** | Hosting y CI/CD del frontend/backend |
| **Sentry** | Monitoreo de errores en producción |

---

## Estructura de Directorios

```
one-padel-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo: rutas públicas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Grupo: rutas protegidas
│   │   ├── layout.tsx            # Layout con sidebar y nav según rol
│   │   ├── admin/                # Rutas exclusivas del administrador
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── finances/
│   │   │   ├── tournaments/
│   │   │   └── reports/
│   │   ├── coach/                # Rutas del entrenador
│   │   │   ├── dashboard/
│   │   │   ├── players/
│   │   │   ├── trainings/
│   │   │   └── evaluations/
│   │   └── player/               # Rutas del jugador
│   │       ├── dashboard/
│   │       ├── bookings/
│   │       ├── my-trainings/
│   │       └── my-evaluations/
│   ├── api/                      # API Routes
│   │   ├── webhooks/
│   │   │   └── stripe/
│   │   ├── bookings/
│   │   ├── tournaments/
│   │   └── notifications/
│   ├── globals.css
│   ├── layout.tsx
│   └── middleware.ts             # Protección de rutas por rol
│
├── components/
│   ├── ui/                       # shadcn/ui generados
│   ├── layout/                   # Sidebar, Navbar, Footer
│   ├── bookings/                 # Componentes de reservas
│   ├── trainings/                # Componentes de entrenamientos
│   ├── tournaments/              # Componentes de torneos
│   ├── finances/                 # Componentes de finanzas
│   ├── evaluations/              # Componentes de evaluaciones
│   └── shared/                   # Componentes reutilizables (Tables, Charts, etc.)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts             # Cliente server (RSC y Server Actions)
│   │   └── middleware.ts         # Cliente para middleware
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhooks.ts
│   ├── validations/              # Esquemas Zod compartidos
│   ├── utils.ts
│   └── constants.ts
│
├── hooks/                        # React hooks personalizados
│   ├── use-auth.ts
│   ├── use-bookings.ts
│   └── use-realtime.ts
│
├── stores/                       # Zustand stores
│   ├── auth-store.ts
│   └── ui-store.ts
│
├── actions/                      # Next.js Server Actions
│   ├── auth.ts
│   ├── bookings.ts
│   ├── trainings.ts
│   ├── tournaments.ts
│   └── finances.ts
│
├── types/
│   ├── database.types.ts         # Tipos generados por Supabase CLI
│   ├── app.types.ts              # Tipos de dominio de la app
│   └── api.types.ts              # Tipos de request/response
│
├── prisma/
│   ├── schema.prisma             # Esquema de base de datos
│   ├── migrations/               # Historial de migraciones
│   └── seed.ts                   # Datos iniciales
│
├── public/
│   ├── images/
│   └── icons/
│
├── .env.local                    # Variables de entorno (no en git)
├── .env.example                  # Plantilla de variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Modelo de Datos (Entidades Principales)

```
profiles          ← extiende auth.users (Supabase)
courts            ← pistas de la academia
bookings          ← reservas de pistas
training_plans    ← planes de entrenamiento
training_sessions ← sesiones individuales dentro de un plan
tournaments       ← torneos
tournament_entries← inscripciones a torneos
evaluations       ← evaluaciones de jugadores
evaluation_items  ← criterios de evaluación
payments          ← pagos y facturas
notifications     ← notificaciones internas
```

Relaciones clave:
- `profiles` 1:N `bookings` (un jugador tiene muchas reservas)
- `profiles` 1:N `training_plans` (como coach o como player)
- `tournaments` 1:N `tournament_entries`
- `profiles` 1:N `evaluations`
- `payments` N:1 `profiles`

---

## Seguridad

- **RLS habilitado** en todas las tablas.
- Los jugadores solo ven sus propios datos.
- Los entrenadores ven datos de sus jugadores asignados.
- Los administradores tienen acceso total.
- Las API Routes validan el JWT y el rol antes de cada operación.
- Los webhooks de Stripe se verifican con la firma de Stripe.
- Rate limiting via Redis (Upstash) en rutas críticas (login, reservas).

---

## Flujo de Autenticación

```
1. Usuario introduce email/password
2. Supabase Auth devuelve JWT con claim de rol
3. Next.js middleware verifica JWT en cada request
4. Si la ruta no corresponde al rol → redirect a /dashboard propio
5. RLS valida que la query solo devuelva los datos permitidos
```

---

## Entornos

| Entorno | URL | Base de datos |
|---|---|---|
| Local | localhost:3000 | Supabase local (Docker) |
| Staging | staging.onepadel.app | Supabase proyecto staging |
| Producción | app.onepadel.app | Supabase proyecto prod |

---

## CI/CD

```
Push a main → Vercel build → Tests (Vitest + Playwright) → Deploy producción
Push a develop → Vercel Preview → Deploy staging automático
```

---

## Decisiones de Arquitectura (ADRs)

| # | Decisión | Alternativa descartada | Motivo |
|---|---|---|---|
| 1 | Supabase en lugar de backend propio | Node.js + Express + Postgres | Velocidad de desarrollo, auth y RLS incluidos |
| 2 | Next.js App Router | CRA o Vite + React | SSR, RSC, Server Actions nativos |
| 3 | Prisma sobre Supabase JS puro | Solo `@supabase/supabase-js` | Migraciones tipadas, seeds, mejor DX |
| 4 | Stripe para pagos | PayPal / redsys | API mejor documentada, webhooks fiables |
| 5 | Vercel para hosting | AWS / DigitalOcean | Zero-config con Next.js, preview URLs |
