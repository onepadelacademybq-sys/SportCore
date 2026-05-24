-- ─── Migration: 20260524100000_create_eval_specialized_tables ─────────────────

-- 1. Golpes técnicos con 5 intentos y columnas generadas
CREATE TABLE eval_technical_shots (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid        NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  stroke_group  text        NOT NULL CHECK (stroke_group IN ('golpes_fondo', 'voleas', 'bandejas', 'smash')),
  stroke_name   text        NOT NULL,
  s1            boolean     NOT NULL DEFAULT false,
  s2            boolean     NOT NULL DEFAULT false,
  s3            boolean     NOT NULL DEFAULT false,
  s4            boolean     NOT NULL DEFAULT false,
  s5            boolean     NOT NULL DEFAULT false,
  hits          smallint    GENERATED ALWAYS AS (
                  (s1::int + s2::int + s3::int + s4::int + s5::int)
                ) STORED,
  pct           numeric(5,2) GENERATED ALWAYS AS (
                  (s1::int + s2::int + s3::int + s4::int + s5::int)::numeric / 5 * 100
                ) STORED,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (evaluation_id, stroke_name)
);

-- 2. Games tácticos (hasta 6 por evaluación)
CREATE TABLE eval_tactical_games (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id uuid        NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  game_number   smallint    NOT NULL CHECK (game_number BETWEEN 1 AND 6),
  pts_player    smallint,
  pts_rival     smallint,
  drive_stats   jsonb       NOT NULL DEFAULT '{}',
  reves_stats   jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (evaluation_id, game_number)
);

-- 3. Antropométrico (1 fila por evaluación)
CREATE TABLE eval_anthropometric (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id       uuid         NOT NULL UNIQUE REFERENCES evaluations(id) ON DELETE CASCADE,
  -- Generales
  peso                numeric(5,2),
  talla               numeric(5,2),
  pct_adiposo         numeric(5,2),
  pct_musculo         numeric(5,2),
  edad_biologica      numeric(4,1),
  grasa_visceral      numeric(5,2),
  -- Pliegues cutáneos (8)
  tricipital          numeric(5,2),
  bicipital           numeric(5,2),
  subescapular        numeric(5,2),
  iliocrestal         numeric(5,2),
  supraespinal        numeric(5,2),
  abdominal           numeric(5,2),
  muslo_pliegue       numeric(5,2),
  pantorrilla_pliegue numeric(5,2),
  -- Perímetros (13)
  pecho_minimo        numeric(5,2),
  cintura             numeric(5,2),
  cadera              numeric(5,2),
  biceps_d_rel        numeric(5,2),
  biceps_d_con        numeric(5,2),
  biceps_i_rel        numeric(5,2),
  biceps_i_con        numeric(5,2),
  antebrazo_d         numeric(5,2),
  antebrazo_i         numeric(5,2),
  muslo_d             numeric(5,2),
  muslo_i             numeric(5,2),
  pantorrilla_d       numeric(5,2),
  pantorrilla_i       numeric(5,2),
  created_at          timestamptz    DEFAULT now()
);

-- 4. Físico (1 fila por evaluación)
CREATE TABLE eval_physical (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id   uuid         NOT NULL UNIQUE REFERENCES evaluations(id) ON DELETE CASCADE,
  -- Saltos (cm) — 3 intentos c/u
  sj_1            numeric(5,2),
  sj_2            numeric(5,2),
  sj_3            numeric(5,2),
  cmj_1           numeric(5,2),
  cmj_2           numeric(5,2),
  cmj_3           numeric(5,2),
  abalakov_1      numeric(5,2),
  abalakov_2      numeric(5,2),
  abalakov_3      numeric(5,2),
  -- Velocidad 10m (seg) — 3 intentos
  vel_10m_1       numeric(5,3),
  vel_10m_2       numeric(5,3),
  vel_10m_3       numeric(5,3),
  -- Agilidad: 8 bolas lateral (seg) — 3 intentos
  bolas_lateral_1 numeric(6,3),
  bolas_lateral_2 numeric(6,3),
  bolas_lateral_3 numeric(6,3),
  -- Agilidad: 8 bolas frontal (seg) — 3 intentos
  bolas_frontal_1 numeric(6,3),
  bolas_frontal_2 numeric(6,3),
  bolas_frontal_3 numeric(6,3),
  -- Desplazamiento lateral derecha/izquierda (seg)
  desplaz_lat_d   numeric(6,3),
  desplaz_lat_i   numeric(6,3),
  -- Gincana zig-zag (seg) — 3 intentos
  zigzag_1        numeric(6,3),
  zigzag_2        numeric(6,3),
  zigzag_3        numeric(6,3),
  -- Resistencia 5K (segundos totales)
  resistencia_5k  numeric(7,2),
  created_at      timestamptz   DEFAULT now()
);
