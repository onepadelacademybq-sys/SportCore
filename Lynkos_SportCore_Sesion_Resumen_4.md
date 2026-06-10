# Sesión 4 — CRM completo + Reportes + Entrenamientos coach

> Fecha: 2026-06-10 · Completada

---

## Trabajo realizado

### 1. Detalle de lead con historial e interacciones
- `components/crm/lead-detail-drawer.tsx` — drawer lateral: tabs Historial / Información, avanzar estado, marcar como perdido con motivo, WhatsApp, registrar interacción manual
- `actions/crm.ts` — +`getLeadInteractions`, +`updateLead`
- `components/crm/leads-pipeline.tsx` — clic en tarjeta abre drawer; botones con `stopPropagation`

### 2. Filtros en el pipeline Kanban
- `components/crm/leads-pipeline.tsx` — búsqueda texto, filtro por fuente (dinámico), toggle cerrados ocultos/visibles

### 3. Asistencia de sesión
- `actions/training.ts` — +`getSessionPlayers` (session → microcycle → mesocycle → assignments → group members)
- `components/training/attendance-panel.tsx` — toggle Presente/Ausente/Justificado, upsert via `recordAttendanceAction`
- Páginas de sesión admin y coach actualizadas

### 4. Botón "Recalcular ahora" en retención
- `components/crm/retention-board.tsx` — botón con `animate-spin`, llama `recalculateRetentionScores()`

### 5. Historial CRM en perfil de usuario
- `actions/crm.ts` — +`getProfileInteractions`
- `components/crm/user-interactions-panel.tsx` — timeline + formulario inline + botón WhatsApp
- `app/(dashboard)/admin/users/[id]/page.tsx` — panel para jugadores y entrenadores

### 6. Módulo Reportes — admin/reports
- `actions/reports.ts` — `getReportData()`: 6 queries Prisma en paralelo
- `components/reports/reports-dashboard.tsx` — 4 tabs: Resumen / Finanzas / Estudiantes / CRM; gráficos de barras div-based
- `app/(dashboard)/admin/reports/page.tsx` — implementado (era `return null`)

### 7. Notificaciones in-app
- Ya estaban completamente implementadas antes de esta sesión
- `actions/notifications.ts` — `getMyNotifications`, `markAsRead`, `markAllAsRead`, `createNotification`, `notifyAdmins`, `getUnreadCount`
- `components/layout/notification-bell.tsx` — campana con badge rojo, dropdown panel, polling 30s, marcar al clic, "Marcar todas"
- `components/layout/sidebar.tsx` — bell wired en desktop footer y mobile top bar

### 8. coach/trainings — Mis Entrenamientos
- `actions/training.ts` — +`getCoachSessions()`: obtiene todas las sesiones del coach vía mesociclos propios, con conteo de asistencia ya registrada
- `components/training/coach-trainings-dashboard.tsx` — dashboard cliente con:
  - 4 KPIs: completadas este mes, programadas, pendientes de asistencia, total
  - 3 tabs: **Próximas** (scheduledAt asc) / **Pendientes** (completadas sin asistencia, con badge de alerta) / **Historial** (desc)
  - Tarjetas de sesión: fecha, hora, mesociclo + semana, duración, badge de estado, badge de asistencia
  - Cada tarjeta es un link directo a `/coach/planning/[mesocycleId]/session/[sessionId]`
  - Badge "Hoy" en sesiones del día actual
- `app/(dashboard)/coach/trainings/page.tsx` — implementado (era `return null`)
- Link en sidebar ya existía: `Entrenamientos → /coach/trainings`

---

## Archivos modificados / creados

| Archivo | Cambio |
|---|---|
| `actions/crm.ts` | +`getLeadInteractions`, +`updateLead`, +`getProfileInteractions` |
| `actions/training.ts` | +`getSessionPlayers`, +`getCoachSessions`, +`CoachSession` type |
| `actions/reports.ts` | Creación nueva |
| `components/crm/lead-detail-drawer.tsx` | Creación nueva |
| `components/crm/leads-pipeline.tsx` | Filtros + drawer |
| `components/crm/retention-board.tsx` | +botón Recalcular |
| `components/crm/user-interactions-panel.tsx` | Creación nueva |
| `components/training/attendance-panel.tsx` | Creación nueva |
| `components/training/coach-trainings-dashboard.tsx` | Creación nueva |
| `components/reports/reports-dashboard.tsx` | Creación nueva |
| `app/(dashboard)/admin/planning/.../session/...` x2 | +AttendancePanel |
| `app/(dashboard)/admin/users/[id]/page.tsx` | +UserInteractionsPanel |
| `app/(dashboard)/admin/reports/page.tsx` | Implementado |
| `app/(dashboard)/coach/trainings/page.tsx` | Implementado |

---

## Estado general del proyecto

| Módulo | Estado |
|---|---|
| Auth + middleware | ✅ |
| Dashboard por rol | ✅ |
| Reservas + E-wallet | ✅ |
| Grupos + facturación | ✅ |
| Evaluaciones V3 | ✅ |
| Planificación + sesiones | ✅ |
| Asistencia de sesión | ✅ |
| Biblioteca de ejercicios | ✅ |
| Torneos (8 formatos) | ✅ |
| Finanzas | ✅ |
| Usuarios admin | ✅ |
| CRM completo | ✅ |
| Reportes / Analytics | ✅ |
| Perfil del entrenador | ✅ |
| Landing pública | ✅ |
| Legal (términos + privacidad) | ✅ |
| **coach/trainings** | ✅ |

---

## Pendiente

- [x] RLS global ✅ → `supabase/rls_policies.sql` (52 tablas, 3 funciones helper)
- [x] Trigger `on_auth_user_created` ✅ → `supabase/auth_trigger.sql`
- [x] Notificaciones in-app ✅ (ya estaba implementado)
- [ ] Deploy Vercel + dominio
- [ ] Emails transaccionales (Resend)
- [ ] Sentry + monitoreo
