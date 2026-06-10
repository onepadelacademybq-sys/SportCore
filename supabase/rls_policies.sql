-- ================================================================
-- ROW LEVEL SECURITY — Lynkos SportCore / One Padel Academy
--
-- Aplicar:
--   psql $DIRECT_URL -f supabase/rls_policies.sql
--
-- Roles del sistema:
--   admin  → acceso completo a toda la organización
--   coach  → acceso a sus grupos, sesiones y jugadores asignados
--   player → solo sus propios datos
-- ================================================================

-- ─── Funciones auxiliares (SECURITY DEFINER evita recursión en profiles) ───────

CREATE OR REPLACE FUNCTION public.get_my_role()
  RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','coach')
  )
$$;

-- ================================================================
-- MÓDULO 0 — Organización
-- ================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_select" ON organizations;
DROP POLICY IF EXISTS "org_write"  ON organizations;

-- Todos los autenticados pueden leer la org (info pública de la academia)
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Solo admin puede modificar
CREATE POLICY "org_write" ON organizations
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 1 — Perfiles
-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Propio perfil + admins ven todo + coaches ven todos los perfiles
-- (necesitan ver jugadores de sus grupos sin JOINs adicionales)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR is_admin()
    OR (get_my_role() = 'coach')
  );

-- INSERT solo via trigger (auth.users → profiles). Se permite también desde admin.
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- Usuarios actualizan su propio perfil; admins actualizan cualquiera
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

-- Solo admin puede desactivar / borrar perfiles
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (is_admin());

-- ================================================================
-- Menores de edad
-- ================================================================

ALTER TABLE guardian_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guardian_select" ON guardian_profiles;
DROP POLICY IF EXISTS "guardian_write"  ON guardian_profiles;

CREATE POLICY "guardian_select" ON guardian_profiles
  FOR SELECT USING (minor_id = auth.uid() OR is_admin());

CREATE POLICY "guardian_write" ON guardian_profiles
  FOR ALL USING (minor_id = auth.uid() OR is_admin());

-- ================================================================
-- E-WALLET
-- ================================================================

ALTER TABLE class_wallet ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_select" ON class_wallet;
DROP POLICY IF EXISTS "wallet_write"  ON class_wallet;

CREATE POLICY "wallet_select" ON class_wallet
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

-- Solo admin crea / actualiza wallets
CREATE POLICY "wallet_write" ON class_wallet
  FOR ALL USING (is_admin());

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_tx_select" ON wallet_transactions;
DROP POLICY IF EXISTS "wallet_tx_write"  ON wallet_transactions;

CREATE POLICY "wallet_tx_select" ON wallet_transactions
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "wallet_tx_write" ON wallet_transactions
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 3 — Instalaciones
-- ================================================================

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courts_select" ON courts;
DROP POLICY IF EXISTS "courts_write"  ON courts;

-- Todos los usuarios autenticados pueden ver las canchas (para reservas)
CREATE POLICY "courts_select" ON courts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "courts_write" ON courts
  FOR ALL USING (is_admin());

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equipment_select" ON equipment;
DROP POLICY IF EXISTS "equipment_write"  ON equipment;

CREATE POLICY "equipment_select" ON equipment
  FOR SELECT USING (is_staff());

CREATE POLICY "equipment_write" ON equipment
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 2 — Reservas
-- ================================================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "bookings_delete" ON bookings;

CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    player_id   = auth.uid()
    OR coach_id  = auth.uid()
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Cualquier usuario puede crear una reserva para sí mismo
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    OR is_admin()
  );

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE USING (
    created_by = auth.uid()
    OR player_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE USING (is_admin());

ALTER TABLE booking_waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_select" ON booking_waitlist;
DROP POLICY IF EXISTS "waitlist_write"  ON booking_waitlist;

CREATE POLICY "waitlist_select" ON booking_waitlist
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "waitlist_write" ON booking_waitlist
  FOR ALL USING (player_id = auth.uid() OR is_admin());

-- ================================================================
-- MÓDULO 11 — Biblioteca de Ejercicios
-- ================================================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercises_select" ON exercises;
DROP POLICY IF EXISTS "exercises_insert" ON exercises;
DROP POLICY IF EXISTS "exercises_update" ON exercises;
DROP POLICY IF EXISTS "exercises_delete" ON exercises;

-- Ejercicios publicados son visibles para todos; no publicados solo para su creador o admin
CREATE POLICY "exercises_select" ON exercises
  FOR SELECT USING (
    is_published = true
    OR created_by = auth.uid()
    OR is_admin()
  );

-- Solo coaches y admins crean ejercicios
CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND is_staff()
  );

CREATE POLICY "exercises_update" ON exercises
  FOR UPDATE USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "exercises_delete" ON exercises
  FOR DELETE USING (created_by = auth.uid() OR is_admin());

ALTER TABLE exercise_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "etags_select" ON exercise_tags;
DROP POLICY IF EXISTS "etags_write"  ON exercise_tags;

CREATE POLICY "etags_select" ON exercise_tags
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "etags_write" ON exercise_tags
  FOR ALL USING (is_admin());

ALTER TABLE exercise_tag_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eta_select" ON exercise_tag_assignments;
DROP POLICY IF EXISTS "eta_write"  ON exercise_tag_assignments;

CREATE POLICY "eta_select" ON exercise_tag_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Coaches pueden asignar tags a sus propios ejercicios
CREATE POLICY "eta_write" ON exercise_tag_assignments
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_tag_assignments.exercise_id
        AND exercises.created_by = auth.uid()
    )
  );

ALTER TABLE exercise_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "efav_select" ON exercise_favorites;
DROP POLICY IF EXISTS "efav_write"  ON exercise_favorites;

CREATE POLICY "efav_select" ON exercise_favorites
  FOR SELECT USING (coach_id = auth.uid() OR is_admin());

CREATE POLICY "efav_write" ON exercise_favorites
  FOR ALL USING (coach_id = auth.uid() OR is_admin());

-- ================================================================
-- MÓDULO 4 — Planificación
-- ================================================================

ALTER TABLE mesocycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meso_select" ON mesocycles;
DROP POLICY IF EXISTS "meso_insert" ON mesocycles;
DROP POLICY IF EXISTS "meso_update" ON mesocycles;
DROP POLICY IF EXISTS "meso_delete" ON mesocycles;

-- Coach ve sus mesociclos; jugadores ven los que tienen asignados; admin ve todo
CREATE POLICY "meso_select" ON mesocycles
  FOR SELECT USING (
    is_admin()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM mesocycle_assignments ma
      WHERE ma.mesocycle_id = mesocycles.id
        AND (
          ma.player_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = ma.group_id
              AND gm.player_id = auth.uid()
              AND gm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "meso_insert" ON mesocycles
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_staff());

CREATE POLICY "meso_update" ON mesocycles
  FOR UPDATE USING (created_by = auth.uid() OR is_admin());

CREATE POLICY "meso_delete" ON mesocycles
  FOR DELETE USING (is_admin());

ALTER TABLE mesocycle_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mesoassign_select" ON mesocycle_assignments;
DROP POLICY IF EXISTS "mesoassign_write"  ON mesocycle_assignments;

CREATE POLICY "mesoassign_select" ON mesocycle_assignments
  FOR SELECT USING (
    is_admin()
    OR assigned_by = auth.uid()
    OR player_id   = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id  = mesocycle_assignments.group_id
        AND gm.player_id = auth.uid()
    )
  );

CREATE POLICY "mesoassign_write" ON mesocycle_assignments
  FOR ALL USING (assigned_by = auth.uid() OR is_admin());

ALTER TABLE microcycles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "micro_select" ON microcycles;
DROP POLICY IF EXISTS "micro_write"  ON microcycles;

-- Microciclos: mismo acceso que el mesociclo padre
CREATE POLICY "micro_select" ON microcycles
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM mesocycles m
      WHERE m.id = microcycles.mesocycle_id
        AND (
          m.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM mesocycle_assignments ma
            WHERE ma.mesocycle_id = m.id
              AND (
                ma.player_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM group_members gm
                  WHERE gm.group_id = ma.group_id AND gm.player_id = auth.uid() AND gm.status = 'active'
                )
              )
          )
        )
    )
  );

CREATE POLICY "micro_write" ON microcycles
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM mesocycles m
      WHERE m.id = microcycles.mesocycle_id AND m.created_by = auth.uid()
    )
  );

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tsession_select" ON training_sessions;
DROP POLICY IF EXISTS "tsession_write"  ON training_sessions;

CREATE POLICY "tsession_select" ON training_sessions
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM microcycles mc
      JOIN mesocycles m ON m.id = mc.mesocycle_id
      WHERE mc.id = training_sessions.microcycle_id
        AND (
          m.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM mesocycle_assignments ma
            WHERE ma.mesocycle_id = m.id
              AND (
                ma.player_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM group_members gm
                  WHERE gm.group_id = ma.group_id AND gm.player_id = auth.uid() AND gm.status = 'active'
                )
              )
          )
        )
    )
  );

CREATE POLICY "tsession_write" ON training_sessions
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM microcycles mc
      JOIN mesocycles m ON m.id = mc.mesocycle_id
      WHERE mc.id = training_sessions.microcycle_id AND m.created_by = auth.uid()
    )
  );

ALTER TABLE session_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sblock_select" ON session_blocks;
DROP POLICY IF EXISTS "sblock_write"  ON session_blocks;

CREATE POLICY "sblock_select" ON session_blocks
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM training_sessions ts
      JOIN microcycles mc ON mc.id = ts.microcycle_id
      JOIN mesocycles m   ON m.id  = mc.mesocycle_id
      WHERE ts.id = session_blocks.session_id
        AND (
          m.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM mesocycle_assignments ma
            WHERE ma.mesocycle_id = m.id
              AND (
                ma.player_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM group_members gm
                  WHERE gm.group_id = ma.group_id AND gm.player_id = auth.uid() AND gm.status = 'active'
                )
              )
          )
        )
    )
  );

CREATE POLICY "sblock_write" ON session_blocks
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM training_sessions ts
      JOIN microcycles mc ON mc.id = ts.microcycle_id
      JOIN mesocycles m   ON m.id  = mc.mesocycle_id
      WHERE ts.id = session_blocks.session_id AND m.created_by = auth.uid()
    )
  );

ALTER TABLE session_block_exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sbe_select" ON session_block_exercises;
DROP POLICY IF EXISTS "sbe_write"  ON session_block_exercises;

CREATE POLICY "sbe_select" ON session_block_exercises
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM session_blocks sb
      JOIN training_sessions ts ON ts.id = sb.session_id
      JOIN microcycles mc       ON mc.id = ts.microcycle_id
      JOIN mesocycles m         ON m.id  = mc.mesocycle_id
      WHERE sb.id = session_block_exercises.block_id
        AND (
          m.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM mesocycle_assignments ma
            WHERE ma.mesocycle_id = m.id
              AND (
                ma.player_id = auth.uid()
                OR EXISTS (
                  SELECT 1 FROM group_members gm
                  WHERE gm.group_id = ma.group_id AND gm.player_id = auth.uid() AND gm.status = 'active'
                )
              )
          )
        )
    )
  );

CREATE POLICY "sbe_write" ON session_block_exercises
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM session_blocks sb
      JOIN training_sessions ts ON ts.id = sb.session_id
      JOIN microcycles mc       ON mc.id = ts.microcycle_id
      JOIN mesocycles m         ON m.id  = mc.mesocycle_id
      WHERE sb.id = session_block_exercises.block_id AND m.created_by = auth.uid()
    )
  );

ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_select" ON session_attendance;
DROP POLICY IF EXISTS "attendance_write"  ON session_attendance;

CREATE POLICY "attendance_select" ON session_attendance
  FOR SELECT USING (
    player_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM training_sessions ts
      JOIN microcycles mc ON mc.id = ts.microcycle_id
      JOIN mesocycles m   ON m.id  = mc.mesocycle_id
      WHERE ts.id = session_attendance.session_id AND m.created_by = auth.uid()
    )
  );

CREATE POLICY "attendance_write" ON session_attendance
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM training_sessions ts
      JOIN microcycles mc ON mc.id = ts.microcycle_id
      JOIN mesocycles m   ON m.id  = mc.mesocycle_id
      WHERE ts.id = session_attendance.session_id AND m.created_by = auth.uid()
    )
  );

-- ================================================================
-- MÓDULO 12 — Grupos de Entrenamiento
-- ================================================================

ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tgroup_select" ON training_groups;
DROP POLICY IF EXISTS "tgroup_insert" ON training_groups;
DROP POLICY IF EXISTS "tgroup_update" ON training_groups;
DROP POLICY IF EXISTS "tgroup_delete" ON training_groups;

CREATE POLICY "tgroup_select" ON training_groups
  FOR SELECT USING (
    is_admin()
    OR coach_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = training_groups.id AND gm.player_id = auth.uid()
    )
  );

CREATE POLICY "tgroup_insert" ON training_groups
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "tgroup_update" ON training_groups
  FOR UPDATE USING (coach_id = auth.uid() OR is_admin());

CREATE POLICY "tgroup_delete" ON training_groups
  FOR DELETE USING (is_admin());

ALTER TABLE group_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gschedule_select" ON group_schedules;
DROP POLICY IF EXISTS "gschedule_write"  ON group_schedules;

CREATE POLICY "gschedule_select" ON group_schedules
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM training_groups tg
      WHERE tg.id = group_schedules.group_id
        AND (
          tg.coach_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM group_members gm
            WHERE gm.group_id = tg.id AND gm.player_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "gschedule_write" ON group_schedules
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM training_groups tg
      WHERE tg.id = group_schedules.group_id AND tg.coach_id = auth.uid()
    )
  );

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gmember_select" ON group_members;
DROP POLICY IF EXISTS "gmember_write"  ON group_members;

CREATE POLICY "gmember_select" ON group_members
  FOR SELECT USING (
    player_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM training_groups tg
      WHERE tg.id = group_members.group_id AND tg.coach_id = auth.uid()
    )
  );

CREATE POLICY "gmember_write" ON group_members
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM training_groups tg
      WHERE tg.id = group_members.group_id AND tg.coach_id = auth.uid()
    )
  );

ALTER TABLE group_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gpayment_select" ON group_payments;
DROP POLICY IF EXISTS "gpayment_write"  ON group_payments;

CREATE POLICY "gpayment_select" ON group_payments
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "gpayment_write" ON group_payments
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 5 — Evaluaciones
-- ================================================================

ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evaltempl_select" ON evaluation_templates;
DROP POLICY IF EXISTS "evaltempl_write"  ON evaluation_templates;

CREATE POLICY "evaltempl_select" ON evaluation_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "evaltempl_write" ON evaluation_templates
  FOR ALL USING (created_by = auth.uid() OR is_admin());

ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evalcrit_select" ON evaluation_criteria;
DROP POLICY IF EXISTS "evalcrit_write"  ON evaluation_criteria;

CREATE POLICY "evalcrit_select" ON evaluation_criteria
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "evalcrit_write" ON evaluation_criteria
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluation_templates et
      WHERE et.id = evaluation_criteria.template_id AND et.created_by = auth.uid()
    )
  );

ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eval_select" ON evaluations;
DROP POLICY IF EXISTS "eval_write"  ON evaluations;

CREATE POLICY "eval_select" ON evaluations
  FOR SELECT USING (
    player_id = auth.uid()
    OR coach_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "eval_write" ON evaluations
  FOR ALL USING (coach_id = auth.uid() OR is_admin());

-- Sub-tablas de evaluación — acceso idéntico al evaluation padre

ALTER TABLE eval_technical_shots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evts_select" ON eval_technical_shots;
DROP POLICY IF EXISTS "evts_write"  ON eval_technical_shots;

CREATE POLICY "evts_select" ON eval_technical_shots
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_technical_shots.evaluation_id
        AND (e.player_id = auth.uid() OR e.coach_id = auth.uid())
    )
  );

CREATE POLICY "evts_write" ON eval_technical_shots
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_technical_shots.evaluation_id AND e.coach_id = auth.uid()
    )
  );

ALTER TABLE eval_tactical_games ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evtg_select" ON eval_tactical_games;
DROP POLICY IF EXISTS "evtg_write"  ON eval_tactical_games;

CREATE POLICY "evtg_select" ON eval_tactical_games
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_tactical_games.evaluation_id
        AND (e.player_id = auth.uid() OR e.coach_id = auth.uid())
    )
  );

CREATE POLICY "evtg_write" ON eval_tactical_games
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_tactical_games.evaluation_id AND e.coach_id = auth.uid()
    )
  );

ALTER TABLE eval_anthropometric ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evan_select" ON eval_anthropometric;
DROP POLICY IF EXISTS "evan_write"  ON eval_anthropometric;

CREATE POLICY "evan_select" ON eval_anthropometric
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_anthropometric.evaluation_id
        AND (e.player_id = auth.uid() OR e.coach_id = auth.uid())
    )
  );

CREATE POLICY "evan_write" ON eval_anthropometric
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_anthropometric.evaluation_id AND e.coach_id = auth.uid()
    )
  );

ALTER TABLE eval_physical ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evph_select" ON eval_physical;
DROP POLICY IF EXISTS "evph_write"  ON eval_physical;

CREATE POLICY "evph_select" ON eval_physical
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_physical.evaluation_id
        AND (e.player_id = auth.uid() OR e.coach_id = auth.uid())
    )
  );

CREATE POLICY "evph_write" ON eval_physical
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = eval_physical.evaluation_id AND e.coach_id = auth.uid()
    )
  );

ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evalres_select" ON evaluation_results;
DROP POLICY IF EXISTS "evalres_write"  ON evaluation_results;

CREATE POLICY "evalres_select" ON evaluation_results
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_results.evaluation_id
        AND (e.player_id = auth.uid() OR e.coach_id = auth.uid())
    )
  );

CREATE POLICY "evalres_write" ON evaluation_results
  FOR ALL USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM evaluations e
      WHERE e.id = evaluation_results.evaluation_id AND e.coach_id = auth.uid()
    )
  );

-- ================================================================
-- MÓDULO 6 — Torneos
-- ================================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tourn_select" ON tournaments;
DROP POLICY IF EXISTS "tourn_write"  ON tournaments;

CREATE POLICY "tourn_select" ON tournaments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "tourn_write" ON tournaments
  FOR ALL USING (is_admin());

ALTER TABLE tournament_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tentry_select" ON tournament_entries;
DROP POLICY IF EXISTS "tentry_insert" ON tournament_entries;
DROP POLICY IF EXISTS "tentry_write"  ON tournament_entries;

CREATE POLICY "tentry_select" ON tournament_entries
  FOR SELECT USING (
    player1_id = auth.uid()
    OR player2_id = auth.uid()
    OR registered_by = auth.uid()
    OR is_admin()
  );

CREATE POLICY "tentry_insert" ON tournament_entries
  FOR INSERT WITH CHECK (
    registered_by = auth.uid()
    OR is_admin()
  );

CREATE POLICY "tentry_write" ON tournament_entries
  FOR ALL USING (is_admin());

ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tmatch_select" ON tournament_matches;
DROP POLICY IF EXISTS "tmatch_write"  ON tournament_matches;

CREATE POLICY "tmatch_select" ON tournament_matches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "tmatch_write" ON tournament_matches
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 7 — Finanzas
-- ================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoice_select" ON invoices;
DROP POLICY IF EXISTS "invoice_write"  ON invoices;

CREATE POLICY "invoice_select" ON invoices
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "invoice_write" ON invoices
  FOR ALL USING (is_admin());

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_select" ON payments;
DROP POLICY IF EXISTS "payment_write"  ON payments;

CREATE POLICY "payment_select" ON payments
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "payment_write" ON payments
  FOR ALL USING (is_admin());

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_select" ON subscriptions;
DROP POLICY IF EXISTS "sub_write"  ON subscriptions;

CREATE POLICY "sub_select" ON subscriptions
  FOR SELECT USING (player_id = auth.uid() OR is_admin());

CREATE POLICY "sub_write" ON subscriptions
  FOR ALL USING (is_admin());

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_all" ON expenses;

CREATE POLICY "expense_all" ON expenses
  FOR ALL USING (is_admin());

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ftx_all" ON financial_transactions;

CREATE POLICY "ftx_all" ON financial_transactions
  FOR ALL USING (is_admin());

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bank_all" ON bank_accounts;

CREATE POLICY "bank_all" ON bank_accounts
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 8 — Notificaciones
-- ================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;
DROP POLICY IF EXISTS "notif_delete" ON notifications;

CREATE POLICY "notif_select" ON notifications
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- Usuarios solo pueden marcar como leídas sus propias notificaciones
CREATE POLICY "notif_update" ON notifications
  FOR UPDATE USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "notif_delete" ON notifications
  FOR DELETE USING (user_id = auth.uid() OR is_admin());

-- INSERT bloqueado para usuarios regulares: createNotification usa el admin client

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifpref_select" ON notification_preferences;
DROP POLICY IF EXISTS "notifpref_write"  ON notification_preferences;

CREATE POLICY "notifpref_select" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "notifpref_write" ON notification_preferences
  FOR ALL USING (user_id = auth.uid() OR is_admin());

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ann_select" ON announcements;
DROP POLICY IF EXISTS "ann_write"  ON announcements;

-- Todos los autenticados pueden leer anuncios
CREATE POLICY "ann_select" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ann_write" ON announcements
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO 10 — Configuración
-- ================================================================

ALTER TABLE academy_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select" ON academy_settings;
DROP POLICY IF EXISTS "settings_write"  ON academy_settings;

CREATE POLICY "settings_select" ON academy_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "settings_write" ON academy_settings
  FOR ALL USING (is_admin());

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_select" ON audit_logs;

CREATE POLICY "audit_select" ON audit_logs
  FOR SELECT USING (is_admin());

-- INSERT en audit_logs solo via service role (trigger o función interna)

-- ================================================================
-- MÓDULO 13 — Perfil del Entrenador
-- ================================================================

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cprofile_select" ON coach_profiles;
DROP POLICY IF EXISTS "cprofile_write"  ON coach_profiles;

CREATE POLICY "cprofile_select" ON coach_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cprofile_write" ON coach_profiles
  FOR ALL USING (coach_id = auth.uid() OR is_admin());

ALTER TABLE coach_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ccert_select" ON coach_certifications;
DROP POLICY IF EXISTS "ccert_write"  ON coach_certifications;

CREATE POLICY "ccert_select" ON coach_certifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ccert_write" ON coach_certifications
  FOR ALL USING (coach_id = auth.uid() OR is_admin());

ALTER TABLE coach_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cavail_select" ON coach_availability;
DROP POLICY IF EXISTS "cavail_write"  ON coach_availability;

CREATE POLICY "cavail_select" ON coach_availability
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "cavail_write" ON coach_availability
  FOR ALL USING (coach_id = auth.uid() OR is_admin());

ALTER TABLE coach_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "crating_select" ON coach_ratings;
DROP POLICY IF EXISTS "crating_insert" ON coach_ratings;
DROP POLICY IF EXISTS "crating_write"  ON coach_ratings;

-- Todos los autenticados pueden leer ratings (info pública del entrenador)
CREATE POLICY "crating_select" ON coach_ratings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Jugadores pueden dejar su propia calificación
CREATE POLICY "crating_insert" ON coach_ratings
  FOR INSERT WITH CHECK (player_id = auth.uid());

-- Solo admin puede modificar/borrar ratings
CREATE POLICY "crating_write" ON coach_ratings
  FOR ALL USING (is_admin());

-- ================================================================
-- MÓDULO CRM — Prospectos, Interacciones, Retención
-- (Datos confidenciales: solo admins)
-- ================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_all" ON leads;

CREATE POLICY "leads_all" ON leads
  FOR ALL USING (is_admin());

ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "interactions_all" ON interactions;

CREATE POLICY "interactions_all" ON interactions
  FOR ALL USING (is_admin());

ALTER TABLE retention_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retention_all" ON retention_scores;

CREATE POLICY "retention_all" ON retention_scores
  FOR ALL USING (is_admin());
