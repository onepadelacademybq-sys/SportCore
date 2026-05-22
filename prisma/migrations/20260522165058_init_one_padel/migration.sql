-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'coach', 'player');

-- CreateEnum
CREATE TYPE "PadelLevel" AS ENUM ('iniciacion', 'intermedio', 'avanzado', 'elite');

-- CreateEnum
CREATE TYPE "CourtType" AS ENUM ('indoor', 'outdoor');

-- CreateEnum
CREATE TYPE "CourtSurface" AS ENUM ('cesped_artificial', 'moqueta', 'cristal', 'hormigon');

-- CreateEnum
CREATE TYPE "CourtStatus" AS ENUM ('active', 'maintenance', 'closed');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- CreateEnum
CREATE TYPE "ExerciseTheme" AS ENUM ('calentamiento', 'tecnica', 'tactica', 'fisico', 'mental', 'vuelta_a_la_calma');

-- CreateEnum
CREATE TYPE "MesocycleStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "SessionBlockType" AS ENUM ('calentamiento', 'central_1_defensa', 'central_2_ataque', 'vuelta_a_la_calma');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'justified');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('active', 'waitlist', 'inactive');

-- CreateEnum
CREATE TYPE "EvalCategory" AS ENUM ('tecnica', 'tactica', 'fisico', 'mental');

-- CreateEnum
CREATE TYPE "EvalLevel" AS ENUM ('C', 'B', 'A', 'Elite');

-- CreateEnum
CREATE TYPE "KpiScoreType" AS ENUM ('scale', 'percentage', 'numeric');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('eliminatoria', 'grupos', 'grupos_y_eliminatoria');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('pending', 'confirmed', 'eliminated', 'withdrawn');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('subscription', 'booking', 'group_fee', 'tournament_entry', 'other');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('stripe', 'cash', 'transfer');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'past_due', 'cancelled');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('monthly', 'quarterly', 'annual');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('equipment', 'maintenance', 'utilities', 'salaries', 'marketing', 'other');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('booking_confirmed', 'booking_reminder', 'booking_cancelled', 'session_assigned', 'session_reminder', 'session_cancelled', 'evaluation_ready', 'payment_processed', 'payment_failed', 'payment_overdue', 'tournament_update', 'group_change', 'announcement');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('active', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "GroupPaymentStatus" AS ENUM ('pending', 'paid', 'partial', 'overdue');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "date_of_birth" DATE,
    "padel_level" "PadelLevel",
    "stripe_customer_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "CourtType" NOT NULL,
    "surface" "CourtSurface" NOT NULL,
    "status" "CourtStatus" NOT NULL DEFAULT 'active',
    "hourly_rate" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "court_id" UUID NOT NULL,
    "player_id" UUID,
    "group_id" UUID,
    "created_by" UUID NOT NULL,
    "session_id" UUID,
    "start_time" TIMESTAMPTZ(6) NOT NULL,
    "end_time" TIMESTAMPTZ(6) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_waitlist" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "court_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "desired_start" TIMESTAMPTZ(6) NOT NULL,
    "desired_end" TIMESTAMPTZ(6) NOT NULL,
    "notified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "theme" "ExerciseTheme" NOT NULL,
    "objective" TEXT NOT NULL,
    "level" "PadelLevel" NOT NULL,
    "estimated_duration_min" INTEGER NOT NULL,
    "materials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_url" TEXT,
    "image_url" TEXT,
    "instructions" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "exercise_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_tag_assignments" (
    "exercise_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,

    CONSTRAINT "exercise_tag_assignments_pkey" PRIMARY KEY ("exercise_id","tag_id")
);

-- CreateTable
CREATE TABLE "exercise_favorites" (
    "coach_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_favorites_pkey" PRIMARY KEY ("coach_id","exercise_id")
);

-- CreateTable
CREATE TABLE "mesocycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "general_objective" TEXT NOT NULL,
    "level" "PadelLevel" NOT NULL,
    "duration_weeks" INTEGER NOT NULL,
    "status" "MesocycleStatus" NOT NULL DEFAULT 'draft',
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "mesocycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesocycle_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mesocycle_id" UUID NOT NULL,
    "player_id" UUID,
    "group_id" UUID,
    "assigned_by" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mesocycle_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "microcycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mesocycle_id" UUID NOT NULL,
    "week_number" INTEGER NOT NULL,
    "weekly_objective" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "microcycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "microcycle_id" UUID NOT NULL,
    "court_id" UUID,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 90,
    "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
    "coach_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "block_type" "SessionBlockType" NOT NULL,
    "order" INTEGER NOT NULL,
    "duration_min" INTEGER NOT NULL DEFAULT 20,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_block_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "block_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "repetitions" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_block_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'present',
    "notes" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "coach_id" UUID NOT NULL,
    "level" "PadelLevel" NOT NULL,
    "max_capacity" INTEGER NOT NULL,
    "monthly_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "GroupStatus" NOT NULL DEFAULT 'active',
    "default_court_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "training_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,

    CONSTRAINT "group_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "status" "GroupMemberStatus" NOT NULL DEFAULT 'waitlist',
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "amount_due" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "GroupPaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_date" DATE,
    "payment_id" UUID,
    "notes" TEXT,

    CONSTRAINT "group_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_criteria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "category" "EvalCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "score_type" "KpiScoreType" NOT NULL DEFAULT 'scale',
    "min_score" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "max_score" DECIMAL(6,2) NOT NULL DEFAULT 10,
    "unit" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "evaluation_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "template_id" UUID,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "overall_score" DECIMAL(4,2),
    "normalized_score" DECIMAL(5,2),
    "level_assigned" "EvalLevel",
    "video_url" TEXT,
    "image_url" TEXT,
    "evaluated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "evaluation_id" UUID NOT NULL,
    "criterion_id" UUID NOT NULL,
    "score" DECIMAL(4,1) NOT NULL,
    "comment" TEXT,

    CONSTRAINT "evaluation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "format" "TournamentFormat" NOT NULL,
    "category" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "max_entries" INTEGER,
    "entry_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "player1_id" UUID NOT NULL,
    "player2_id" UUID,
    "registered_by" UUID NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'pending',
    "registered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tournament_id" UUID NOT NULL,
    "entry1_id" UUID NOT NULL,
    "entry2_id" UUID,
    "round" TEXT NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "court_id" UUID,
    "score_entry1" TEXT,
    "score_entry2" TEXT,
    "winner_entry_id" UUID,
    "status" "MatchStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(4,2) NOT NULL DEFAULT 21,
    "tax_amount" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issued_at" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" DATE,
    "pdf_url" TEXT,
    "stripe_invoice_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "invoice_id" UUID,
    "type" "PaymentType" NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'stripe',
    "stripe_payment_intent_id" TEXT,
    "paid_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "player_id" UUID NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_type" "SubscriptionPlan" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'trialing',
    "stripe_subscription_id" TEXT,
    "current_period_start" DATE NOT NULL,
    "current_period_end" DATE NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "registered_by" UUID NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expense_date" DATE NOT NULL,
    "external_invoice_ref" TEXT,
    "attachment_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" UUID NOT NULL,
    "email_bookings" BOOLEAN NOT NULL DEFAULT true,
    "email_payments" BOOLEAN NOT NULL DEFAULT true,
    "email_sessions" BOOLEAN NOT NULL DEFAULT true,
    "email_evaluations" BOOLEAN NOT NULL DEFAULT true,
    "email_tournaments" BOOLEAN NOT NULL DEFAULT true,
    "in_app_all" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_by" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target_role" "UserRole",
    "target_group_id" UUID,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL DEFAULT 'One Padel',
    "logo_url" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "opening_time" TIME(6) NOT NULL DEFAULT '08:00'::time,
    "closing_time" TIME(6) NOT NULL DEFAULT '22:00'::time,
    "min_booking_advance_hours" INTEGER NOT NULL DEFAULT 2,
    "max_booking_advance_days" INTEGER NOT NULL DEFAULT 14,
    "cancellation_deadline_hours" INTEGER NOT NULL DEFAULT 24,
    "stripe_publishable_key" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "academy_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" UUID,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_profiles" (
    "coach_id" UUID NOT NULL,
    "bio" TEXT,
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferred_levels" "PadelLevel"[],
    "training_style" TEXT,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT[] DEFAULT ARRAY['es']::TEXT[],
    "rating_average" DECIMAL(3,2),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "coach_profiles_pkey" PRIMARY KEY ("coach_id")
);

-- CreateTable
CREATE TABLE "coach_certifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "issuing_organization" TEXT NOT NULL,
    "obtained_at" DATE NOT NULL,
    "expires_at" DATE,
    "document_url" TEXT,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_availability" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,

    CONSTRAINT "coach_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_ratings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coach_id" UUID NOT NULL,
    "player_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_stripe_customer_id_key" ON "profiles"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_tags_name_key" ON "exercise_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "microcycles_mesocycle_id_week_number_key" ON "microcycles"("mesocycle_id", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "session_blocks_session_id_block_type_key" ON "session_blocks"("session_id", "block_type");

-- CreateIndex
CREATE UNIQUE INDEX "session_attendance_session_id_player_id_key" ON "session_attendance"("session_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_members_group_id_player_id_key" ON "group_members"("group_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_payments_group_id_player_id_period_year_period_month_key" ON "group_payments"("group_id", "player_id", "period_year", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_results_evaluation_id_criterion_id_key" ON "evaluation_results"("evaluation_id", "criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_stripe_invoice_id_key" ON "invoices"("stripe_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "coach_ratings_coach_id_player_id_key" ON "coach_ratings"("coach_id", "player_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "training_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_waitlist" ADD CONSTRAINT "booking_waitlist_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_waitlist" ADD CONSTRAINT "booking_waitlist_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_tag_assignments" ADD CONSTRAINT "exercise_tag_assignments_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_tag_assignments" ADD CONSTRAINT "exercise_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "exercise_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_favorites" ADD CONSTRAINT "exercise_favorites_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_favorites" ADD CONSTRAINT "exercise_favorites_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycles" ADD CONSTRAINT "mesocycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_assignments" ADD CONSTRAINT "mesocycle_assignments_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_assignments" ADD CONSTRAINT "mesocycle_assignments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_assignments" ADD CONSTRAINT "mesocycle_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "training_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesocycle_assignments" ADD CONSTRAINT "mesocycle_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microcycles" ADD CONSTRAINT "microcycles_mesocycle_id_fkey" FOREIGN KEY ("mesocycle_id") REFERENCES "mesocycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_microcycle_id_fkey" FOREIGN KEY ("microcycle_id") REFERENCES "microcycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_blocks" ADD CONSTRAINT "session_blocks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_block_exercises" ADD CONSTRAINT "session_block_exercises_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "session_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_block_exercises" ADD CONSTRAINT "session_block_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "training_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_groups" ADD CONSTRAINT "training_groups_default_court_id_fkey" FOREIGN KEY ("default_court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_schedules" ADD CONSTRAINT "group_schedules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "training_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "training_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_payments" ADD CONSTRAINT "group_payments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "training_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_payments" ADD CONSTRAINT "group_payments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_payments" ADD CONSTRAINT "group_payments_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_templates" ADD CONSTRAINT "evaluation_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_criteria" ADD CONSTRAINT "evaluation_criteria_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "evaluation_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_entries" ADD CONSTRAINT "tournament_entries_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_entry1_id_fkey" FOREIGN KEY ("entry1_id") REFERENCES "tournament_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_entry2_id_fkey" FOREIGN KEY ("entry2_id") REFERENCES "tournament_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_entry_id_fkey" FOREIGN KEY ("winner_entry_id") REFERENCES "tournament_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_target_group_id_fkey" FOREIGN KEY ("target_group_id") REFERENCES "training_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_profiles" ADD CONSTRAINT "coach_profiles_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_certifications" ADD CONSTRAINT "coach_certifications_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coach_profiles"("coach_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_availability" ADD CONSTRAINT "coach_availability_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coach_profiles"("coach_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_ratings" ADD CONSTRAINT "coach_ratings_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coach_profiles"("coach_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_ratings" ADD CONSTRAINT "coach_ratings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
