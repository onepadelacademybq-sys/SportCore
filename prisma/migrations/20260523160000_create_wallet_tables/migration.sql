CREATE TABLE class_wallet (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID        NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_classes     INT         NOT NULL DEFAULT 0,
  used_classes      INT         NOT NULL DEFAULT 0,
  available_classes INT         GENERATED ALWAYS AS (total_classes - used_classes) STORED,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  booking_id  UUID                    REFERENCES bookings(id) ON DELETE SET NULL,
  type        TEXT        NOT NULL CHECK (type IN ('credit', 'debit')),
  classes     INT         NOT NULL CHECK (classes > 0),
  description TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_class_wallet_updated_at
  BEFORE UPDATE ON class_wallet
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
