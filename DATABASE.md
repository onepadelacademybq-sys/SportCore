# DATABASE.md — One Padel Academy

## Convenciones

| Convención | Detalle |
|---|---|
| Tipos de PK | `uuid` generado con `gen_random_uuid()` |
| Timestamps | `timestamptz` (con zona horaria) en UTC |
| Soft delete | Columna `is_active` o `status` — nunca `DELETE` físico en datos críticos |
| Auditoría | `created_at` y `updated_at` en todas las tablas principales |
| Enums | Definidos como tipos PostgreSQL (`CREATE TYPE`) |
| Esquema | Todo en el esquema `public` salvo `auth.users` (Supabase) |
| Moneda | `numeric(10,2)` en EUR por defecto |
| RLS | Habilitado en todas las tablas |

---

## Visión General del Esquema (ERD textual)

```
auth.users (Supabase)
    │
    ▼
profiles ──────────────────────────────────────────────────┐
    │                                                        │
    ├── coach_profiles ──► coach_certifications             │
    │       └──────────► coach_availability                 │
    │       └──────────► coach_ratings                      │
    │                                                        │
    ├── bookings ──────► courts                             │
    │                                                        │
    ├── mesocycle_assignments ◄── mesocycles                │
    │                                 └── microcycles        │
    │                                       └── training_sessions
    │                                               └── session_blocks
    │                                                     └── session_block_exercises ──► exercises
    │                                               └── session_attendance             exercises ──► exercise_tags
    │                                                                                   exercises ──► exercise_favorites
    ├── group_members ◄── training_groups ──► group_schedules
    │                           └── group_payments ──► payments
    │
    ├── evaluations ──► evaluation_templates ──► evaluation_criteria
    │       └── evaluation_results
    │
    ├── tournament_entries ◄── tournaments
    │       └── tournament_matches
    │
    ├── payments ──► invoices
    ├── subscriptions
    ├── expenses
    │
    ├── notifications
    ├── notification_preferences
    └── announcements

academy_settings  (tabla singleton)
audit_logs
```

---

## Tipos Enumerados (PostgreSQL ENUM)

```sql
-- Roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'player');

-- Nivel de pádel
CREATE TYPE padel_level AS ENUM (
  '5ta_masculino', '6ta_masculino', '7ma_masculino',
  'femenino_d', 'femenino_c',
  'juvenil_s18', 'juvenil_s16', 'juvenil_s14',
  'prejuvenil', 'baby_padel'
);

-- Estado general
CREATE TYPE record_status AS ENUM ('active', 'inactive', 'archived');

-- Tipo de pista
CREATE TYPE court_type AS ENUM ('indoor', 'outdoor');

-- Superficie de pista
CREATE TYPE court_surface AS ENUM ('cesped_artificial', 'moqueta', 'cristal', 'hormigon');

-- Estado de pista
CREATE TYPE court_status AS ENUM ('active', 'maintenance', 'closed');

-- Estado de reserva
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- Temática de ejercicio
CREATE TYPE exercise_theme AS ENUM ('calentamiento', 'tecnica', 'tactica', 'fisico', 'mental', 'vuelta_a_la_calma');

-- Estado de mesociclo
CREATE TYPE mesocycle_status AS ENUM ('draft', 'active', 'completed', 'archived');

-- Tipo de bloque de sesión
CREATE TYPE session_block_type AS ENUM ('calentamiento', 'central_1_defensa', 'central_2_ataque', 'vuelta_a_la_calma');

-- Estado de sesión
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Estado de asistencia
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'justified');

-- Estado de miembro de grupo
CREATE TYPE group_member_status AS ENUM ('active', 'waitlist', 'inactive');

-- Categoría de evaluación
CREATE TYPE eval_category AS ENUM ('tecnica', 'tactica', 'fisico', 'mental');

-- Tipo de escala de un KPI de evaluación
CREATE TYPE kpi_score_type AS ENUM ('scale', 'percentage', 'numeric');

-- Nivel KPI evaluación
CREATE TYPE eval_level AS ENUM ('C', 'B', 'A', 'Elite');

-- Formato de torneo
CREATE TYPE tournament_format AS ENUM ('eliminatoria', 'grupos', 'grupos_y_eliminatoria');

-- Estado de torneo
CREATE TYPE tournament_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');

-- Estado de inscripción a torneo
CREATE TYPE entry_status AS ENUM ('pending', 'confirmed', 'eliminated', 'withdrawn');

-- Estado de partido
CREATE TYPE match_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Tipo de pago
CREATE TYPE payment_type AS ENUM ('subscription', 'booking', 'group_fee', 'tournament_entry', 'other');

-- Método de pago
CREATE TYPE payment_method AS ENUM ('stripe', 'cash', 'transfer');

-- Estado de pago
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Estado de factura
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'cancelled');

-- Estado de suscripción
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled');

-- Tipo de plan de suscripción
CREATE TYPE subscription_plan AS ENUM ('monthly', 'quarterly', 'annual');

-- Categoría de gasto
CREATE TYPE expense_category AS ENUM ('equipment', 'maintenance', 'utilities', 'salaries', 'marketing', 'other');

-- Tipo de notificación
CREATE TYPE notification_type AS ENUM (
    'booking_confirmed', 'booking_reminder', 'booking_cancelled',
    'session_assigned', 'session_reminder', 'session_cancelled',
    'evaluation_ready', 'payment_processed', 'payment_failed',
    'payment_overdue', 'tournament_update', 'group_change', 'announcement'
);

-- Estado de grupo
CREATE TYPE group_status AS ENUM ('active', 'paused', 'closed');

-- Estado de pago de grupo
CREATE TYPE group_payment_status AS ENUM ('pending', 'paid', 'partial', 'overdue');
```

---

## Tablas

---

### `profiles`
**Módulo:** 1 — Autenticación y Gestión de Usuarios
**Descripción:** Extiende `auth.users` de Supabase con información de perfil y rol. Una fila por usuario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | Mismo UUID que `auth.users.id` |
| `email` | `text` NOT NULL UNIQUE | Email del usuario (sincronizado con auth) |
| `full_name` | `text` NOT NULL | Nombre completo |
| `avatar_url` | `text` | URL del avatar en Supabase Storage |
| `role` | `user_role` NOT NULL | `admin`, `coach` o `player` |
| `phone` | `text` | Teléfono de contacto |
| `date_of_birth` | `date` | Fecha de nacimiento |
| `padel_level` | `padel_level` | Nivel actual de pádel |
| `stripe_customer_id` | `text` UNIQUE | ID de cliente en Stripe |
| `is_active` | `boolean` DEFAULT true | Cuenta activa o desactivada |
| `created_at` | `timestamptz` DEFAULT now() | Fecha de registro |
| `updated_at` | `timestamptz` DEFAULT now() | Última modificación |

**FK:** `id` → `auth.users(id)` ON DELETE CASCADE

---

### `courts`
**Módulo:** 3 — Gestión de Instalaciones
**Descripción:** Pistas físicas de la academia.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** DEFAULT gen_random_uuid() | |
| `name` | `text` NOT NULL | Nombre de la pista (ej. "Pista 1") |
| `type` | `court_type` NOT NULL | `indoor` o `outdoor` |
| `surface` | `court_surface` NOT NULL | Tipo de superficie |
| `status` | `court_status` NOT NULL DEFAULT 'active' | Estado operativo |
| `hourly_rate` | `numeric(10,2)` NOT NULL DEFAULT 0 | Tarifa por hora en EUR |
| `image_url` | `text` | Foto de la pista |
| `notes` | `text` | Notas internas |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### `equipment`
**Módulo:** 3 — Gestión de Instalaciones
**Descripción:** Inventario de material de la academia.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `name` | `text` NOT NULL | Nombre del artículo |
| `category` | `text` NOT NULL | Categoría (pala, pelotas, conos, red, otro) |
| `quantity` | `integer` NOT NULL DEFAULT 0 | Stock disponible |
| `condition` | `text` DEFAULT 'good' | Estado: good / fair / poor |
| `notes` | `text` | Notas adicionales |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### `bookings`
**Módulo:** 2 — Reservas de Pistas
**Descripción:** Reservas individuales o de grupo sobre una pista en un rango horario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `court_id` | `uuid` NOT NULL | Pista reservada |
| `player_id` | `uuid` | Jugador (para reservas individuales) |
| `group_id` | `uuid` | Grupo (para sesiones de grupo) |
| `created_by` | `uuid` NOT NULL | Usuario que creó la reserva |
| `session_id` | `uuid` | Sesión de entrenamiento asociada (opcional) |
| `start_time` | `timestamptz` NOT NULL | Inicio de la reserva |
| `end_time` | `timestamptz` NOT NULL | Fin de la reserva |
| `status` | `booking_status` NOT NULL DEFAULT 'pending' | Estado de la reserva |
| `is_recurring` | `boolean` DEFAULT false | Reserva recurrente |
| `recurrence_rule` | `text` | Regla RRULE (si `is_recurring = true`) |
| `price` | `numeric(10,2)` DEFAULT 0 | Precio cobrado en esta reserva |
| `notes` | `text` | Notas internas |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:**
- `court_id` → `courts(id)`
- `player_id` → `profiles(id)`
- `group_id` → `training_groups(id)`
- `created_by` → `profiles(id)`
- `session_id` → `training_sessions(id)`

**CHECK:** `(player_id IS NOT NULL OR group_id IS NOT NULL)` — al menos uno de los dos debe estar presente.

---

### `booking_waitlist`
**Módulo:** 2 — Reservas de Pistas
**Descripción:** Lista de espera cuando una pista está ocupada.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `court_id` | `uuid` NOT NULL | Pista solicitada |
| `player_id` | `uuid` NOT NULL | Jugador en espera |
| `desired_start` | `timestamptz` NOT NULL | Horario deseado |
| `desired_end` | `timestamptz` NOT NULL | Fin deseado |
| `notified_at` | `timestamptz` | Cuándo se notificó disponibilidad |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `court_id` → `courts(id)`, `player_id` → `profiles(id)`

---

### `exercises`
**Módulo:** 11 — Biblioteca de Ejercicios
**Descripción:** Catálogo central de ejercicios reutilizables en sesiones de entrenamiento.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `created_by` | `uuid` NOT NULL | Coach o admin que creó el ejercicio |
| `name` | `text` NOT NULL | Nombre del ejercicio |
| `theme` | `exercise_theme` NOT NULL | Temática principal del ejercicio |
| `objective` | `text` NOT NULL | Qué mejora o trabaja el ejercicio |
| `level` | `padel_level` NOT NULL | Nivel mínimo recomendado |
| `estimated_duration_min` | `integer` NOT NULL | Duración estimada en minutos |
| `materials` | `text[]` DEFAULT '{}' | Materiales necesarios (array) |
| `video_url` | `text` | URL de vídeo demostrativo |
| `image_url` | `text` | Imagen o diagrama del ejercicio |
| `instructions` | `text` | Instrucciones paso a paso |
| `is_published` | `boolean` DEFAULT false | Visible para todos los coaches |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `created_by` → `profiles(id)`

---

### `exercise_tags`
**Módulo:** 11
**Descripción:** Etiquetas para clasificar y buscar ejercicios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `name` | `text` NOT NULL UNIQUE | Nombre de la etiqueta (ej. "volea", "globo") |

---

### `exercise_tag_assignments`
**Módulo:** 11
**Descripción:** Relación N:M entre ejercicios y etiquetas.

| Campo | Tipo | Descripción |
|---|---|---|
| `exercise_id` | `uuid` NOT NULL | |
| `tag_id` | `uuid` NOT NULL | |

**PK:** (`exercise_id`, `tag_id`)
**FK:** `exercise_id` → `exercises(id)` ON DELETE CASCADE, `tag_id` → `exercise_tags(id)` ON DELETE CASCADE

---

### `exercise_favorites`
**Módulo:** 11
**Descripción:** Ejercicios marcados como favoritos por cada coach.

| Campo | Tipo | Descripción |
|---|---|---|
| `coach_id` | `uuid` NOT NULL | |
| `exercise_id` | `uuid` NOT NULL | |
| `created_at` | `timestamptz` DEFAULT now() | |

**PK:** (`coach_id`, `exercise_id`)
**FK:** `coach_id` → `profiles(id)` ON DELETE CASCADE, `exercise_id` → `exercises(id)` ON DELETE CASCADE

---

### `mesocycles`
**Módulo:** 4 — Planificación de Entrenamientos
**Descripción:** Período largo de entrenamiento con objetivo global. Nivel superior de la jerarquía.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `created_by` | `uuid` NOT NULL | Coach creador |
| `name` | `text` NOT NULL | Nombre (ej. "Pretemporada Verano 2025") |
| `general_objective` | `text` NOT NULL | Foco principal del período |
| `level` | `padel_level` NOT NULL | Nivel de los jugadores objetivo |
| `duration_weeks` | `integer` NOT NULL | Duración en semanas (4–8) |
| `status` | `mesocycle_status` NOT NULL DEFAULT 'draft' | Estado del mesociclo |
| `start_date` | `date` | Fecha de inicio (se fija al activar) |
| `end_date` | `date` | Calculado: start_date + duration_weeks * 7 |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `created_by` → `profiles(id)`
**CHECK:** `duration_weeks BETWEEN 4 AND 8`

---

### `mesocycle_assignments`
**Módulo:** 4
**Descripción:** Asignación de un mesociclo a uno o varios jugadores o a un grupo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `mesocycle_id` | `uuid` NOT NULL | |
| `player_id` | `uuid` | Jugador asignado (si es individual) |
| `group_id` | `uuid` | Grupo asignado (si es grupal) |
| `assigned_by` | `uuid` NOT NULL | Coach o admin que asignó |
| `assigned_at` | `timestamptz` DEFAULT now() | |

**FK:** `mesocycle_id` → `mesocycles(id)`, `player_id` → `profiles(id)`, `group_id` → `training_groups(id)`, `assigned_by` → `profiles(id)`
**CHECK:** `(player_id IS NOT NULL OR group_id IS NOT NULL)`

---

### `microcycles`
**Módulo:** 4
**Descripción:** Semana de entrenamiento dentro de un mesociclo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `mesocycle_id` | `uuid` NOT NULL | Mesociclo al que pertenece |
| `week_number` | `integer` NOT NULL | Número de semana dentro del mesociclo (1…N) |
| `weekly_objective` | `text` | Foco específico de esta semana |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `mesocycle_id` → `mesocycles(id)` ON DELETE CASCADE
**UNIQUE:** (`mesocycle_id`, `week_number`)

---

### `training_sessions`
**Módulo:** 4
**Descripción:** Clase individual dentro de un microciclo. Contiene exactamente 4 bloques.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `microcycle_id` | `uuid` NOT NULL | Microciclo al que pertenece |
| `court_id` | `uuid` | Pista asignada |
| `scheduled_at` | `timestamptz` NOT NULL | Fecha y hora de la sesión |
| `duration_min` | `integer` NOT NULL DEFAULT 90 | Duración total en minutos |
| `status` | `session_status` NOT NULL DEFAULT 'scheduled' | Estado de la sesión |
| `coach_notes` | `text` | Notas generales del entrenador |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `microcycle_id` → `microcycles(id)` ON DELETE CASCADE, `court_id` → `courts(id)`

---

### `session_blocks`
**Módulo:** 4
**Descripción:** Los 4 bloques fijos de cada sesión (calentamiento, defensa, ataque, vuelta a la calma). Se crean automáticamente al crear una sesión.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `session_id` | `uuid` NOT NULL | Sesión a la que pertenece |
| `block_type` | `session_block_type` NOT NULL | Tipo de bloque (enum fijo) |
| `order` | `integer` NOT NULL | Orden: 1=calentamiento, 2=defensa, 3=ataque, 4=vuelta |
| `duration_min` | `integer` NOT NULL DEFAULT 20 | Duración estimada en minutos |
| `notes` | `text` | Notas específicas del bloque |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `session_id` → `training_sessions(id)` ON DELETE CASCADE
**UNIQUE:** (`session_id`, `block_type`) — exactamente 1 bloque de cada tipo por sesión
**CHECK:** `order BETWEEN 1 AND 4`

---

### `session_block_exercises`
**Módulo:** 4 + 11
**Descripción:** Ejercicios asignados a cada bloque de sesión, en orden específico.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `block_id` | `uuid` NOT NULL | Bloque al que pertenece |
| `exercise_id` | `uuid` NOT NULL | Ejercicio de la biblioteca |
| `order` | `integer` NOT NULL | Orden del ejercicio dentro del bloque |
| `repetitions` | `text` | Ej. "3 series × 10 rep" o "15 min" |
| `notes` | `text` | Instrucción particular para esta sesión |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `block_id` → `session_blocks(id)` ON DELETE CASCADE, `exercise_id` → `exercises(id)`

---

### `session_attendance`
**Módulo:** 4
**Descripción:** Registro de asistencia por jugador por sesión.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `session_id` | `uuid` NOT NULL | Sesión |
| `player_id` | `uuid` NOT NULL | Jugador |
| `status` | `attendance_status` NOT NULL DEFAULT 'present' | Estado de asistencia |
| `notes` | `text` | Motivo de falta justificada, etc. |
| `recorded_at` | `timestamptz` DEFAULT now() | Cuándo se registró |

**FK:** `session_id` → `training_sessions(id)`, `player_id` → `profiles(id)`
**UNIQUE:** (`session_id`, `player_id`)

---

### `training_groups`
**Módulo:** 12 — Grupos de Entrenamiento
**Descripción:** Grupos de jugadores con horario fijo, cupo y tarifa propia.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `name` | `text` NOT NULL | Nombre del grupo (ej. "Martes/Jueves Intermedio") |
| `coach_id` | `uuid` NOT NULL | Entrenador responsable |
| `level` | `padel_level` NOT NULL | Nivel del grupo |
| `max_capacity` | `integer` NOT NULL | Cupo máximo de jugadores |
| `monthly_fee` | `numeric(10,2)` NOT NULL DEFAULT 0 | Cuota mensual en EUR |
| `status` | `group_status` NOT NULL DEFAULT 'active' | Estado del grupo |
| `default_court_id` | `uuid` | Pista asignada habitualmente |
| `notes` | `text` | Notas internas del admin |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `coach_id` → `profiles(id)`, `default_court_id` → `courts(id)`

---

### `group_schedules`
**Módulo:** 12
**Descripción:** Horarios recurrentes semanales de un grupo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `group_id` | `uuid` NOT NULL | Grupo al que pertenece |
| `day_of_week` | `integer` NOT NULL | 0=Domingo … 6=Sábado |
| `start_time` | `time` NOT NULL | Hora de inicio |
| `end_time` | `time` NOT NULL | Hora de fin |

**FK:** `group_id` → `training_groups(id)` ON DELETE CASCADE
**CHECK:** `day_of_week BETWEEN 0 AND 6`

---

### `group_members`
**Módulo:** 12
**Descripción:** Jugadores inscritos en un grupo (activos, en espera o dados de baja).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `group_id` | `uuid` NOT NULL | Grupo |
| `player_id` | `uuid` NOT NULL | Jugador |
| `status` | `group_member_status` NOT NULL DEFAULT 'waitlist' | Estado de membresía |
| `joined_at` | `timestamptz` DEFAULT now() | Fecha de incorporación activa |
| `left_at` | `timestamptz` | Fecha de baja (null = sigue activo) |
| `notes` | `text` | Observaciones |

**FK:** `group_id` → `training_groups(id)`, `player_id` → `profiles(id)`
**UNIQUE:** (`group_id`, `player_id`) — un jugador no puede estar dos veces en el mismo grupo activo

---

### `group_payments`
**Módulo:** 12 — Control Financiero por Grupo
**Descripción:** Registro mensual de cuotas de cada jugador en cada grupo. Es la base del control financiero por grupo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `group_id` | `uuid` NOT NULL | Grupo |
| `player_id` | `uuid` NOT NULL | Jugador |
| `period_year` | `integer` NOT NULL | Año del período (ej. 2025) |
| `period_month` | `integer` NOT NULL | Mes del período (1–12) |
| `amount_due` | `numeric(10,2)` NOT NULL | Importe a pagar (copia de monthly_fee en el momento) |
| `amount_paid` | `numeric(10,2)` NOT NULL DEFAULT 0 | Importe pagado |
| `status` | `group_payment_status` NOT NULL DEFAULT 'pending' | Estado del cobro |
| `payment_date` | `date` | Fecha en que se realizó el pago |
| `payment_id` | `uuid` | Referencia al pago registrado en `payments` |
| `notes` | `text` | Notas del admin |

**FK:** `group_id` → `training_groups(id)`, `player_id` → `profiles(id)`, `payment_id` → `payments(id)`
**UNIQUE:** (`group_id`, `player_id`, `period_year`, `period_month`)
**CHECK:** `period_month BETWEEN 1 AND 12`

---

### `evaluation_templates`
**Módulo:** 5 — Evaluaciones
**Descripción:** Plantillas reutilizables que definen los criterios de evaluación.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `created_by` | `uuid` NOT NULL | Coach o admin creador |
| `name` | `text` NOT NULL | Nombre de la plantilla |
| `description` | `text` | Descripción del propósito |
| `is_active` | `boolean` DEFAULT true | Plantilla disponible para usar |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `created_by` → `profiles(id)`

---

### `evaluation_criteria`
**Módulo:** 5
**Descripción:** Criterios individuales dentro de la plantilla oficial de evaluación de la academia.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `template_id` | `uuid` NOT NULL | Plantilla a la que pertenece |
| `category` | `eval_category` NOT NULL | Categoría: técnica, táctica, físico, mental |
| `name` | `text` NOT NULL | Nombre del criterio (ej. "Golpe de derecha") |
| `description` | `text` | Qué se evalúa exactamente |
| `score_type` | `kpi_score_type` NOT NULL DEFAULT 'scale' | Tipo de escala del KPI: `scale` (ej. 1–10), `percentage` (0–100 %), `numeric` (valor absoluto con unidad) |
| `min_score` | `numeric(6,2)` NOT NULL DEFAULT 0 | Valor mínimo posible (normalmente 0) |
| `max_score` | `numeric(6,2)` NOT NULL DEFAULT 10 | Valor máximo posible (10 para scale, 100 para percentage) |
| `unit` | `text` | Unidad del KPI solo si `score_type = 'numeric'` (ej. `'seg'`, `'m'`, `'rep'`). Null para scale y percentage. |
| `order` | `integer` NOT NULL | Orden de presentación en el formulario |

**FK:** `template_id` → `evaluation_templates(id)` ON DELETE CASCADE
**CHECK:** `min_score < max_score`
**NOTA:** La academia usa una única plantilla oficial. `score_type = 'scale'` y `score_type = 'percentage'` no requieren `unit`. `score_type = 'numeric'` requiere `unit` (enforced a nivel de aplicación).

---

### `evaluations`
**Módulo:** 5
**Descripción:** Evaluación concreta realizada a un jugador en una fecha.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `player_id` | `uuid` NOT NULL | Jugador evaluado |
| `coach_id` | `uuid` NOT NULL | Entrenador que evalúa |
| `template_id` | `uuid` | Plantilla usada (puede ser null si es libre) |
| `title` | `text` NOT NULL | Título de la evaluación |
| `notes` | `text` | Observaciones generales |
| `overall_score` | `numeric(4,2)` | Media ponderada de los scores en su escala original |
| `normalized_score` | `numeric(5,2)` | Score siempre expresado sobre 100. Permite comparar evolución entre evaluaciones aunque cambien los rangos de los KPIs. Calculado por trigger. |
| `level_assigned` | `eval_level` | Nivel asignado: C, B, A, Elite |
| `video_url` | `text` | Vídeo de la evaluación |
| `image_url` | `text` | Imagen adjunta |
| `evaluated_at` | `timestamptz` NOT NULL DEFAULT now() | Fecha de la evaluación |
| `is_shared` | `boolean` DEFAULT false | Si el jugador puede verla |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `player_id` → `profiles(id)`, `coach_id` → `profiles(id)`, `template_id` → `evaluation_templates(id)`

---

### `evaluation_results`
**Módulo:** 5
**Descripción:** Puntuación individual por criterio dentro de una evaluación.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `evaluation_id` | `uuid` NOT NULL | Evaluación a la que pertenece |
| `criterion_id` | `uuid` NOT NULL | Criterio evaluado |
| `score` | `numeric(4,1)` NOT NULL | Puntuación obtenida |
| `comment` | `text` | Comentario específico del criterio |

**FK:** `evaluation_id` → `evaluations(id)` ON DELETE CASCADE, `criterion_id` → `evaluation_criteria(id)`
**UNIQUE:** (`evaluation_id`, `criterion_id`)

---

### `tournaments`
**Módulo:** 6 — Torneos
**Descripción:** Torneo organizado por la academia.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `created_by` | `uuid` NOT NULL | Admin creador |
| `name` | `text` NOT NULL | Nombre del torneo |
| `format` | `tournament_format` NOT NULL | Formato de competición |
| `category` | `text` NOT NULL | Categoría (ej. "Masculino B", "Mixto A") |
| `start_date` | `date` NOT NULL | Fecha de inicio |
| `end_date` | `date` NOT NULL | Fecha de fin |
| `status` | `tournament_status` NOT NULL DEFAULT 'draft' | Estado del torneo |
| `max_entries` | `integer` | Máximo de inscripciones |
| `entry_fee` | `numeric(10,2)` DEFAULT 0 | Precio de inscripción en EUR |
| `description` | `text` | Descripción pública del torneo |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `created_by` → `profiles(id)`

---

### `tournament_entries`
**Módulo:** 6
**Descripción:** Inscripción de una pareja o jugador individual a un torneo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `tournament_id` | `uuid` NOT NULL | Torneo |
| `player1_id` | `uuid` NOT NULL | Jugador 1 (o el único en individual) |
| `player2_id` | `uuid` | Jugador 2 (pareja, opcional) |
| `registered_by` | `uuid` NOT NULL | Quién registró la pareja |
| `status` | `entry_status` NOT NULL DEFAULT 'pending' | Estado de la inscripción |
| `registered_at` | `timestamptz` DEFAULT now() | |

**FK:** `tournament_id` → `tournaments(id)`, `player1_id` → `profiles(id)`, `player2_id` → `profiles(id)`, `registered_by` → `profiles(id)`

---

### `tournament_matches`
**Módulo:** 6
**Descripción:** Partido individual dentro de un torneo.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `tournament_id` | `uuid` NOT NULL | Torneo al que pertenece |
| `entry1_id` | `uuid` NOT NULL | Primera pareja/jugador |
| `entry2_id` | `uuid` | Segunda pareja/jugador (null = bye) |
| `round` | `text` NOT NULL | Ronda (ej. "Cuartos", "Grupo A - Jornada 1") |
| `scheduled_at` | `timestamptz` | Fecha y hora planificada |
| `court_id` | `uuid` | Pista asignada |
| `score_entry1` | `text` | Resultado pareja 1 (ej. "6-3 6-4") |
| `score_entry2` | `text` | Resultado pareja 2 |
| `winner_entry_id` | `uuid` | Entrada ganadora (null si no ha terminado) |
| `status` | `match_status` NOT NULL DEFAULT 'scheduled' | Estado del partido |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `tournament_id` → `tournaments(id)`, `entry1_id` / `entry2_id` / `winner_entry_id` → `tournament_entries(id)`, `court_id` → `courts(id)`

---

### `invoices`
**Módulo:** 7 — Finanzas
**Descripción:** Facturas generadas para un jugador.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `player_id` | `uuid` NOT NULL | Destinatario de la factura |
| `invoice_number` | `text` NOT NULL UNIQUE | Número de factura (ej. "OP-2025-0001") |
| `net_amount` | `numeric(10,2)` NOT NULL | Base imponible |
| `tax_rate` | `numeric(4,2)` NOT NULL DEFAULT 21 | IVA aplicado (%) |
| `tax_amount` | `numeric(10,2)` NOT NULL | Importe del IVA |
| `total_amount` | `numeric(10,2)` NOT NULL | Total con IVA |
| `status` | `invoice_status` NOT NULL DEFAULT 'draft' | Estado |
| `issued_at` | `date` NOT NULL DEFAULT CURRENT_DATE | Fecha de emisión |
| `due_at` | `date` | Fecha de vencimiento |
| `pdf_url` | `text` | URL del PDF en Supabase Storage |
| `stripe_invoice_id` | `text` UNIQUE | ID en Stripe (si aplica) |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `player_id` → `profiles(id)`

---

### `payments`
**Módulo:** 7
**Descripción:** Registro de cada cobro realizado. Es la fuente de verdad de ingresos.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `player_id` | `uuid` NOT NULL | Jugador que paga |
| `invoice_id` | `uuid` | Factura asociada (opcional) |
| `type` | `payment_type` NOT NULL | Tipo de cobro |
| `concept` | `text` NOT NULL | Descripción del cobro |
| `amount` | `numeric(10,2)` NOT NULL | Importe en EUR |
| `status` | `payment_status` NOT NULL DEFAULT 'pending' | Estado del pago |
| `payment_method` | `payment_method` NOT NULL DEFAULT 'stripe' | Medio de pago |
| `stripe_payment_intent_id` | `text` UNIQUE | ID de PaymentIntent en Stripe |
| `paid_at` | `timestamptz` | Cuándo se confirmó el pago |
| `notes` | `text` | Notas del admin |
| `metadata` | `jsonb` DEFAULT '{}' | Datos flexibles (ej. booking_id, group_id) |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `player_id` → `profiles(id)`, `invoice_id` → `invoices(id)`

---

### `subscriptions`
**Módulo:** 7
**Descripción:** Suscripciones recurrentes de los jugadores (gestionadas con Stripe).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `player_id` | `uuid` NOT NULL | Jugador suscrito |
| `plan_name` | `text` NOT NULL | Nombre del plan (ej. "Plan Mensual Pro") |
| `plan_type` | `subscription_plan` NOT NULL | monthly / quarterly / annual |
| `price` | `numeric(10,2)` NOT NULL | Precio del ciclo |
| `status` | `subscription_status` NOT NULL DEFAULT 'trialing' | Estado |
| `stripe_subscription_id` | `text` UNIQUE | ID en Stripe |
| `current_period_start` | `date` NOT NULL | Inicio del período actual |
| `current_period_end` | `date` NOT NULL | Fin del período actual |
| `cancelled_at` | `timestamptz` | Cuándo se canceló (null = activa) |
| `created_at` | `timestamptz` DEFAULT now() | |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `player_id` → `profiles(id)`

---

### `expenses`
**Módulo:** 7
**Descripción:** Gastos de la academia. Junto con `payments` forma el flujo de caja.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `registered_by` | `uuid` NOT NULL | Admin que registró el gasto |
| `category` | `expense_category` NOT NULL | Categoría del gasto |
| `concept` | `text` NOT NULL | Descripción del gasto |
| `amount` | `numeric(10,2)` NOT NULL | Importe en EUR |
| `expense_date` | `date` NOT NULL | Fecha del gasto |
| `external_invoice_ref` | `text` | Número de factura del proveedor |
| `attachment_url` | `text` | Justificante en Supabase Storage |
| `notes` | `text` | Notas adicionales |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `registered_by` → `profiles(id)`

---

### `notifications`
**Módulo:** 8 — Notificaciones
**Descripción:** Notificaciones in-app para cada usuario.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `user_id` | `uuid` NOT NULL | Destinatario |
| `type` | `notification_type` NOT NULL | Tipo de evento |
| `title` | `text` NOT NULL | Título de la notificación |
| `body` | `text` NOT NULL | Contenido |
| `is_read` | `boolean` DEFAULT false | Marcada como leída |
| `action_url` | `text` | Ruta interna de acción (deep link) |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `user_id` → `profiles(id)` ON DELETE CASCADE

---

### `notification_preferences`
**Módulo:** 8
**Descripción:** Preferencias de notificación por usuario (una fila por usuario).

| Campo | Tipo | Descripción |
|---|---|---|
| `user_id` | `uuid` **PK** | |
| `email_bookings` | `boolean` DEFAULT true | Emails de reservas |
| `email_payments` | `boolean` DEFAULT true | Emails de pagos |
| `email_sessions` | `boolean` DEFAULT true | Emails de sesiones |
| `email_evaluations` | `boolean` DEFAULT true | Emails de evaluaciones |
| `email_tournaments` | `boolean` DEFAULT true | Emails de torneos |
| `in_app_all` | `boolean` DEFAULT true | Todas las notificaciones in-app |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `user_id` → `profiles(id)` ON DELETE CASCADE

---

### `announcements`
**Módulo:** 8
**Descripción:** Comunicados masivos enviados por admin o coach a grupos de usuarios.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `created_by` | `uuid` NOT NULL | Admin o coach emisor |
| `title` | `text` NOT NULL | Asunto del comunicado |
| `body` | `text` NOT NULL | Contenido |
| `target_role` | `user_role` | Rol destinatario (null = todos) |
| `target_group_id` | `uuid` | Grupo específico destinatario (null = todos) |
| `sent_at` | `timestamptz` | Cuándo se envió (null = borrador) |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `created_by` → `profiles(id)`, `target_group_id` → `training_groups(id)`

---

### `academy_settings`
**Módulo:** 10 — Configuración
**Descripción:** Configuración global de la academia. Tabla singleton (siempre 1 fila).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** DEFAULT gen_random_uuid() | Siempre el mismo UUID |
| `name` | `text` NOT NULL DEFAULT 'One Padel' | Nombre de la academia |
| `logo_url` | `text` | Logo en Supabase Storage |
| `address` | `text` | Dirección física |
| `phone` | `text` | Teléfono de contacto |
| `email` | `text` | Email de contacto público |
| `opening_time` | `time` NOT NULL DEFAULT '08:00' | Hora de apertura |
| `closing_time` | `time` NOT NULL DEFAULT '22:00' | Hora de cierre |
| `min_booking_advance_hours` | `integer` DEFAULT 2 | Antelación mínima para reservar |
| `max_booking_advance_days` | `integer` DEFAULT 14 | Antelación máxima para reservar |
| `cancellation_deadline_hours` | `integer` DEFAULT 24 | Horas antes para cancelar sin penalización |
| `stripe_publishable_key` | `text` | Clave pública de Stripe (no secreta) |
| `updated_at` | `timestamptz` DEFAULT now() | |

---

### `audit_logs`
**Módulo:** 10
**Descripción:** Registro de auditoría de acciones críticas. Solo escritura (vía triggers).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `user_id` | `uuid` | Usuario que realizó la acción |
| `action` | `text` NOT NULL | Acción: INSERT / UPDATE / DELETE + contexto |
| `table_name` | `text` NOT NULL | Tabla afectada |
| `record_id` | `uuid` | ID del registro afectado |
| `old_data` | `jsonb` | Datos antes del cambio (UPDATE/DELETE) |
| `new_data` | `jsonb` | Datos después del cambio (INSERT/UPDATE) |
| `ip_address` | `text` | IP del cliente (si disponible) |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `user_id` → `profiles(id)` ON DELETE SET NULL

---

### `coach_profiles`
**Módulo:** 13 — Perfil del Entrenador
**Descripción:** Información profesional extendida de cada entrenador.

| Campo | Tipo | Descripción |
|---|---|---|
| `coach_id` | `uuid` **PK** | Mismo ID que `profiles.id` |
| `bio` | `text` | Presentación profesional |
| `specialties` | `text[]` DEFAULT '{}' | Áreas de especialización (array) |
| `preferred_levels` | `padel_level[]` DEFAULT '{}' | Niveles con los que trabaja mejor |
| `training_style` | `text` | Descripción del estilo de entrenamiento |
| `years_experience` | `integer` DEFAULT 0 | Años de experiencia como entrenador |
| `languages` | `text[]` DEFAULT '{es}' | Idiomas de entrenamiento |
| `rating_average` | `numeric(3,2)` | Media de valoraciones (calculado) |
| `updated_at` | `timestamptz` DEFAULT now() | |

**FK:** `coach_id` → `profiles(id)` ON DELETE CASCADE

---

### `coach_certifications`
**Módulo:** 13
**Descripción:** Titulaciones y certificaciones del entrenador.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `coach_id` | `uuid` NOT NULL | Entrenador |
| `title` | `text` NOT NULL | Nombre de la certificación |
| `issuing_organization` | `text` NOT NULL | Organismo emisor (FEP, ITF, RPT, etc.) |
| `obtained_at` | `date` NOT NULL | Fecha de obtención |
| `expires_at` | `date` | Fecha de caducidad (null = sin caducidad) |
| `document_url` | `text` | Documento en Supabase Storage |
| `is_validated` | `boolean` DEFAULT false | Admin ha validado el documento |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `coach_id` → `profiles(id)` ON DELETE CASCADE

---

### `coach_availability`
**Módulo:** 13
**Descripción:** Franjas horarias semanales en las que el entrenador está disponible.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `coach_id` | `uuid` NOT NULL | Entrenador |
| `day_of_week` | `integer` NOT NULL | 0=Domingo … 6=Sábado |
| `start_time` | `time` NOT NULL | Inicio de disponibilidad |
| `end_time` | `time` NOT NULL | Fin de disponibilidad |

**FK:** `coach_id` → `profiles(id)` ON DELETE CASCADE
**CHECK:** `day_of_week BETWEEN 0 AND 6`

---

### `coach_ratings`
**Módulo:** 13
**Descripción:** Valoraciones opcionales de jugadores sobre su entrenador.

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `uuid` **PK** | |
| `coach_id` | `uuid` NOT NULL | Entrenador valorado |
| `player_id` | `uuid` NOT NULL | Jugador que valora |
| `score` | `integer` NOT NULL | Puntuación de 1 a 5 |
| `comment` | `text` | Comentario opcional |
| `created_at` | `timestamptz` DEFAULT now() | |

**FK:** `coach_id` → `profiles(id)`, `player_id` → `profiles(id)`
**UNIQUE:** (`coach_id`, `player_id`) — un jugador valora una vez a cada coach
**CHECK:** `score BETWEEN 1 AND 5`

---

## Relaciones Entre Tablas

### Diagrama de dependencias por módulo

```
── Módulo 1/13 ──────────────────────────────────────────────────────
auth.users              1 ─── 1    profiles
profiles                1 ─── 1    coach_profiles
coach_profiles          1 ─── N    coach_certifications
coach_profiles          1 ─── N    coach_availability
profiles                1 ─── N    coach_ratings (como coach)
profiles                1 ─── N    coach_ratings (como player)

── Módulo 2/3 ───────────────────────────────────────────────────────
courts                  1 ─── N    bookings
profiles                1 ─── N    bookings (como player)
profiles                1 ─── N    bookings (como created_by)
training_groups         1 ─── N    bookings (como group)
courts                  1 ─── N    booking_waitlist
profiles                1 ─── N    booking_waitlist

── Módulo 4 ─────────────────────────────────────────────────────────
profiles                1 ─── N    mesocycles (como created_by)
mesocycles              1 ─── N    mesocycle_assignments
profiles                1 ─── N    mesocycle_assignments (como player)
training_groups         1 ─── N    mesocycle_assignments (como group)
mesocycles              1 ─── N    microcycles
microcycles             1 ─── N    training_sessions
training_sessions       1 ─── 4    session_blocks           (exactamente 4)
session_blocks          1 ─── N    session_block_exercises
exercises               1 ─── N    session_block_exercises
training_sessions       1 ─── N    session_attendance
courts                  1 ─── N    training_sessions

── Módulo 5 ─────────────────────────────────────────────────────────
profiles                1 ─── N    evaluation_templates (como created_by)
evaluation_templates    1 ─── N    evaluation_criteria
profiles                1 ─── N    evaluations (como player)
profiles                1 ─── N    evaluations (como coach)
evaluation_templates    1 ─── N    evaluations
evaluations             1 ─── N    evaluation_results
evaluation_criteria     1 ─── N    evaluation_results

── Módulo 6 ─────────────────────────────────────────────────────────
profiles                1 ─── N    tournaments (como created_by)
tournaments             1 ─── N    tournament_entries
profiles                1 ─── N    tournament_entries (player1)
profiles                1 ─── N    tournament_entries (player2)
tournament_entries      1 ─── N    tournament_matches (como entry1/entry2)
courts                  1 ─── N    tournament_matches

── Módulo 7 ─────────────────────────────────────────────────────────
profiles                1 ─── N    invoices
invoices                1 ─── N    payments
profiles                1 ─── N    payments
profiles                1 ─── N    subscriptions
profiles                1 ─── N    expenses (como registered_by)
group_payments          N ─── 1    payments
training_groups         1 ─── N    group_payments
profiles                1 ─── N    group_payments

── Módulo 8 ─────────────────────────────────────────────────────────
profiles                1 ─── N    notifications
profiles                1 ─── 1    notification_preferences
profiles                1 ─── N    announcements (como created_by)
training_groups         1 ─── N    announcements (como target)

── Módulo 11 ────────────────────────────────────────────────────────
profiles                1 ─── N    exercises (como created_by)
exercises               N ─── N    exercise_tags (via exercise_tag_assignments)
profiles                N ─── N    exercises (via exercise_favorites)

── Módulo 12 ────────────────────────────────────────────────────────
profiles                1 ─── N    training_groups (como coach)
courts                  1 ─── N    training_groups (default_court)
training_groups         1 ─── N    group_schedules
training_groups         1 ─── N    group_members
profiles                1 ─── N    group_members (como player)
training_groups         1 ─── N    group_payments
```

---

## Políticas RLS (Row Level Security)

### Principios generales

```sql
-- Función de ayuda: obtener el rol del usuario actual desde el JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT (auth.jwt() ->> 'user_role')::user_role;
$$ LANGUAGE sql STABLE;

-- Función de ayuda: obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION auth.uid_is(user_uuid uuid)
RETURNS boolean AS $$
  SELECT auth.uid() = user_uuid;
$$ LANGUAGE sql STABLE;
```

---

### `profiles`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Coach: las suyas + las de sus jugadores (via group_members). Player: solo la suya. |
| UPDATE | Todos pueden actualizar su propio perfil. Admin puede actualizar cualquier perfil. |
| INSERT | Solo mediante trigger automático al crear usuario en auth.users. |
| DELETE | Solo admin. |

```sql
-- Ejemplo SELECT
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (
  auth.user_role() = 'admin'
  OR auth.uid() = id
  OR (
    auth.user_role() = 'coach'
    AND id IN (
      SELECT player_id FROM group_members gm
      JOIN training_groups tg ON tg.id = gm.group_id
      WHERE tg.coach_id = auth.uid() AND gm.status = 'active'
    )
  )
);
```

---

### `courts`

| Operación | Política |
|---|---|
| SELECT | Todos los usuarios autenticados. |
| INSERT / UPDATE / DELETE | Solo admin. |

---

### `bookings`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Coach: las de sus grupos + las que creó. Player: solo las suyas. |
| INSERT | Admin: cualquier reserva. Coach: reservas de sus grupos o sus jugadores. Player: solo para sí mismo. |
| UPDATE | Admin: cualquier reserva. Coach: sus reservas de grupo. Player: solo las propias con status 'pending'. |
| DELETE | Solo admin. |

---

### `exercises`

| Operación | Política |
|---|---|
| SELECT | Admin y coach: todas las publicadas (`is_published = true`) + las propias. Player: solo ejercicios de sus sesiones asignadas. |
| INSERT | Admin y coach. |
| UPDATE | Admin: cualquier ejercicio. Coach: solo los propios (`created_by = auth.uid()`). |
| DELETE | Solo admin. |

---

### `mesocycles`

| Operación | Política |
|---|---|
| SELECT | Admin: todos. Coach: los propios (`created_by = auth.uid()`). Player: los que tiene asignados (via mesocycle_assignments). |
| INSERT / UPDATE | Admin y coach (solo los propios). |
| DELETE | Solo admin. |

---

### `microcycles` / `training_sessions` / `session_blocks` / `session_block_exercises`

| Operación | Política |
|---|---|
| SELECT | Heredan la visibilidad del mesociclo padre. |
| INSERT / UPDATE | Admin y el coach propietario del mesociclo. |
| DELETE | Solo admin. |

---

### `session_attendance`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Coach: de sus sesiones. Player: solo la propia. |
| INSERT / UPDATE | Admin y coach (solo sus sesiones). |

---

### `training_groups`

| Operación | Política |
|---|---|
| SELECT | Admin: todos. Coach: sus grupos (`coach_id = auth.uid()`). Player: el grupo al que pertenece. |
| INSERT / UPDATE / DELETE | Solo admin. |

---

### `group_members`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Coach: los miembros de sus grupos. Player: solo su propia membresía. |
| INSERT / UPDATE | Solo admin. |

---

### `group_payments`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Coach: los pagos de sus grupos (solo lectura). Player: solo los suyos. |
| INSERT / UPDATE | Solo admin. |

---

### `evaluations`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Coach: las que creó (`coach_id = auth.uid()`). Player: solo las propias donde `is_shared = true`. |
| INSERT | Admin y coach. |
| UPDATE | Admin: cualquier evaluación. Coach: solo las propias y solo si no están compartidas aún. |

---

### `payments` / `invoices`

| Operación | Política |
|---|---|
| SELECT | Admin: todos. Player y Coach: solo los propios (`player_id = auth.uid()`). |
| INSERT / UPDATE | Solo admin (y webhooks de Stripe via service role). |

---

### `expenses`

| Operación | Política |
|---|---|
| SELECT | Solo admin. |
| INSERT / UPDATE | Solo admin. |

---

### `subscriptions`

| Operación | Política |
|---|---|
| SELECT | Admin: todas. Player: solo la propia. |
| INSERT / UPDATE | Solo admin y service role (Stripe webhook). |

---

### `notifications`

| Operación | Política |
|---|---|
| SELECT | Cada usuario ve solo las suyas (`user_id = auth.uid()`). |
| UPDATE (`is_read`) | Cada usuario puede marcar las suyas como leídas. |
| INSERT | Solo service role (sistema). |

---

### `tournaments` / `tournament_entries` / `tournament_matches`

| Operación | Política |
|---|---|
| SELECT tournaments | Todos los autenticados. |
| INSERT / UPDATE / DELETE tournaments | Solo admin. |
| SELECT entries | Todos. |
| INSERT entries | Admin, coach y el propio player (para inscribirse). |
| UPDATE entries | Admin y coach. |
| SELECT / UPDATE matches | Admin y coach. Player: solo lectura. |

---

### `coach_profiles` / `coach_certifications` / `coach_availability`

| Operación | Política |
|---|---|
| SELECT coach_profiles | Admin: todos. Coach: el propio + datos públicos de otros. Player: perfil público de su coach asignado. |
| SELECT certifications | Admin: todas. Coach: las propias. |
| INSERT / UPDATE (propio) | Admin y el coach propietario. |
| Validar certification | Solo admin (`is_validated`). |

---

### `academy_settings`

| Operación | Política |
|---|---|
| SELECT | Todos los autenticados. |
| UPDATE | Solo admin. |

---

### `audit_logs`

| Operación | Política |
|---|---|
| SELECT | Solo admin. |
| INSERT | Solo service role (triggers del sistema). |

---

## Índices Recomendados

```sql
-- Reservas
CREATE INDEX idx_bookings_court_time ON bookings (court_id, start_time, end_time);
CREATE INDEX idx_bookings_player ON bookings (player_id);
CREATE INDEX idx_bookings_group ON bookings (group_id);

-- Sesiones de entrenamiento
CREATE INDEX idx_training_sessions_microcycle ON training_sessions (microcycle_id);
CREATE INDEX idx_training_sessions_scheduled ON training_sessions (scheduled_at);
CREATE INDEX idx_session_attendance_session ON session_attendance (session_id);
CREATE INDEX idx_session_attendance_player ON session_attendance (player_id);

-- Evaluaciones
CREATE INDEX idx_evaluations_player ON evaluations (player_id, evaluated_at DESC);
CREATE INDEX idx_evaluations_coach ON evaluations (coach_id);

-- Pagos y finanzas
CREATE INDEX idx_payments_player ON payments (player_id, created_at DESC);
CREATE INDEX idx_group_payments_group_period ON group_payments (group_id, period_year, period_month);
CREATE INDEX idx_group_payments_status ON group_payments (status);

-- Notificaciones
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);

-- Ejercicios
CREATE INDEX idx_exercises_theme ON exercises (theme);
CREATE INDEX idx_exercises_level ON exercises (level);

-- Miembros de grupo
CREATE INDEX idx_group_members_group ON group_members (group_id, status);
CREATE INDEX idx_group_members_player ON group_members (player_id, status);

-- Torneos
CREATE INDEX idx_tournament_entries_tournament ON tournament_entries (tournament_id, status);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches (tournament_id);
```

---

## Triggers Obligatorios

| Trigger | Tabla | Evento | Acción |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | INSERT | Crea fila en `profiles` con role='player' por defecto |
| `on_coach_profile_needed` | `profiles` | UPDATE (role→coach) | Crea fila en `coach_profiles` |
| `set_updated_at` | Todas | UPDATE | Actualiza `updated_at` a `now()` |
| `create_session_blocks` | `training_sessions` | INSERT | Crea automáticamente los 4 bloques fijos |
| `update_coach_rating_avg` | `coach_ratings` | INSERT/UPDATE/DELETE | Recalcula `coach_profiles.rating_average` |
| `update_eval_scores` | `evaluation_results` | INSERT/UPDATE/DELETE | Recalcula `evaluations.overall_score` (media en escala original) y `evaluations.normalized_score` (media de cada `(score - min_score) / (max_score - min_score) * 100` expresada sobre 100) |
| `audit_critical_tables` | payments, invoices, profiles, group_payments | ALL | Inserta en `audit_logs` |
| `check_group_capacity` | `group_members` | INSERT | Si cupo lleno, asigna status='waitlist' automáticamente |
