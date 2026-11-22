-- LeeTKOB PA#3 schema (PA3_PLAN.md §3.3).
-- Exactly-once: jobs.submission_id is unique, a claim is one UPDATE with
-- FOR UPDATE SKIP LOCKED, and verdicts are unique per (submission, constraint).

CREATE TABLE users (
  id            bigserial PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role          text NOT NULL CHECK (role IN ('admin', 'ta', 'student')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classes (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  invite_code text NOT NULL UNIQUE
);

CREATE TABLE class_members (
  class_id      bigint NOT NULL REFERENCES classes (id),
  user_id       bigint NOT NULL REFERENCES users (id),
  role_in_class text NOT NULL CHECK (role_in_class IN ('ta', 'student')),
  PRIMARY KEY (class_id, user_id)
);

CREATE TABLE labs (
  id           bigserial PRIMARY KEY,
  class_id     bigint NOT NULL REFERENCES classes (id),
  title        text NOT NULL,
  statement    text NOT NULL,
  tests_json   jsonb NOT NULL,
  cost_cap_usd numeric(10, 4) NOT NULL DEFAULT 1,
  opens_at     timestamptz NOT NULL DEFAULT now(),
  deadline_at  timestamptz NOT NULL,
  published_at timestamptz,
  created_by   bigint NOT NULL REFERENCES users (id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE constraints (
  id        bigserial PRIMARY KEY,
  lab_id    bigint NOT NULL REFERENCES labs (id),
  text      text NOT NULL,
  deduction numeric(5, 2) NOT NULL CHECK (deduction >= 0),
  kind      text NOT NULL CHECK (kind IN ('ban_list', 'semantic')),
  position  int NOT NULL,
  UNIQUE (lab_id, position)
);

CREATE TABLE submissions (
  id                bigserial PRIMARY KEY,
  lab_id            bigint NOT NULL REFERENCES labs (id),
  student_id        bigint NOT NULL REFERENCES users (id),
  source_code       text NOT NULL,
  judge_verdict     text CHECK (judge_verdict IN ('AC', 'WA', 'TLE', 'MLE', 'RE', 'CE')),
  test_results_json jsonb,
  status            text NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'judging', 'judged', 'error')),
  is_counted        boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submissions_lab_student ON submissions (lab_id, student_id, created_at DESC);

CREATE TABLE jobs (
  id            bigserial PRIMARY KEY,
  submission_id bigint NOT NULL UNIQUE REFERENCES submissions (id),
  status        text NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'claimed', 'done', 'failed')),
  claimed_by    text,
  lease_until   timestamptz,
  attempts      int NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_claimable ON jobs (id) WHERE status IN ('queued', 'claimed');

CREATE TABLE verdicts (
  id            bigserial PRIMARY KEY,
  submission_id bigint NOT NULL REFERENCES submissions (id),
  constraint_id bigint NOT NULL REFERENCES constraints (id),
  verdict       text NOT NULL CHECK (verdict IN ('pass', 'violation', 'unsure')),
  evidence_json jsonb NOT NULL DEFAULT '[]',
  decided_by    text NOT NULL CHECK (decided_by IN ('hard_rule', 'model', 'fallback')),
  unsure_reason text CHECK (unsure_reason IN (
                  'model_unsure', 'schema_invalid', 'evidence_mismatch',
                  'timeout', 'cost_cap', 'hard_rule_unsure')),
  ta_decision   text CHECK (ta_decision IN ('pass', 'violation')),
  reviewed      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, constraint_id)
);

CREATE TABLE model_calls (
  id                  bigserial PRIMARY KEY,
  submission_id       bigint NOT NULL REFERENCES submissions (id),
  constraint_id       bigint REFERENCES constraints (id),
  provider            text NOT NULL,
  model               text NOT NULL,
  provider_request_id text,
  prompt              text,
  tokens_in           int,
  tokens_out          int,
  latency_ms          int,
  cost_usd            numeric(12, 6),
  outcome             text,
  created_at          timestamptz NOT NULL DEFAULT now()
);
