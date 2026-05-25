-- Migration: Módulo de Finanzas
-- Crea el libro de transacciones financieras (ledger unificado), las cuentas
-- bancarias y las tarifas por franja horaria del entrenador.
-- Idempotente: seguro de re-ejecutar si un intento previo falló a medias.

-- ─── Enums ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FinancialTxType" AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "FinancialCategory" AS ENUM (
    'booking_income', 'group_income', 'court_cost',
    'coach_payment', 'manual_expense', 'manual_income'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AccountType" AS ENUM ('ahorros', 'corriente');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Tarifas del entrenador por franja horaria ─────────────────────────────
ALTER TABLE coach_profiles
  ADD COLUMN IF NOT EXISTS hourly_rate_am      INT NOT NULL DEFAULT 35000,  -- L-V 5:00–15:59
  ADD COLUMN IF NOT EXISTS hourly_rate_pm      INT NOT NULL DEFAULT 70000,  -- L-V 16:00–22:00
  ADD COLUMN IF NOT EXISTS hourly_rate_weekend INT NOT NULL DEFAULT 60000;  -- Sáb-Dom

-- ─── Cuentas bancarias ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bank_accounts (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT          NOT NULL,              -- alias interno de la cuenta
  bank_name       TEXT          NOT NULL,
  account_number  TEXT,                                -- últimos 4 dígitos
  account_type    "AccountType" NOT NULL,
  current_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency        TEXT          NOT NULL DEFAULT 'COP',
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── Libro de transacciones financieras ────────────────────────────────────
CREATE TABLE IF NOT EXISTS financial_transactions (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  type            "FinancialTxType"   NOT NULL,
  category        "FinancialCategory" NOT NULL,
  amount          NUMERIC(12,2)       NOT NULL,
  description     TEXT                NOT NULL,
  booking_id      UUID                REFERENCES bookings(id)      ON DELETE SET NULL,
  group_id        UUID                REFERENCES training_groups(id) ON DELETE SET NULL,
  bank_account_id UUID                REFERENCES bank_accounts(id) ON DELETE SET NULL,
  date            DATE                NOT NULL,
  created_by      UUID                NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_transactions_type_date_idx ON financial_transactions (type, date);
CREATE INDEX IF NOT EXISTS financial_transactions_category_idx  ON financial_transactions (category);
CREATE INDEX IF NOT EXISTS financial_transactions_booking_idx   ON financial_transactions (booking_id);
CREATE INDEX IF NOT EXISTS financial_transactions_group_idx     ON financial_transactions (group_id);
