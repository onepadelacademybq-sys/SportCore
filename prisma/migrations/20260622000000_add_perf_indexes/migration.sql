-- ============================================================
-- Migración: índices de rendimiento — bookings y notifications
-- Fecha: 2026-06-22
-- Auditoría: bookings.start_time sin índice → sequential scan
-- en todas las queries de calendario y disponibilidad.
-- ============================================================

-- ── bookings ──────────────────────────────────────────────────

-- El calendario y la vista de disponibilidad filtran por rango
-- de start_time en casi toda query; sin índice hacen seq scan.
CREATE INDEX IF NOT EXISTS idx_bookings_start_time
  ON bookings(start_time);

-- Queries de solapamiento usan start_time + end_time juntos.
-- El índice compuesto cubre ambas columnas en un solo scan.
CREATE INDEX IF NOT EXISTS idx_bookings_start_end
  ON bookings(start_time, end_time);

-- ensureFutureGroupSessions y las vistas de grupo filtran por group_id.
CREATE INDEX IF NOT EXISTS idx_bookings_group
  ON bookings(group_id);

-- ── notifications ─────────────────────────────────────────────

-- El polling de notificaciones filtra siempre por user_id.
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id);

-- La query de conteo de no-leídas filtra user_id + is_read.
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read);
