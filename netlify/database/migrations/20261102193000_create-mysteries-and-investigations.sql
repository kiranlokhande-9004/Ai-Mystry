CREATE TABLE mysteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_title TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  case_overview JSONB NOT NULL,
  suspects JSONB NOT NULL,
  timeline JSONB NOT NULL,
  evidence JSONB NOT NULL,
  solution JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mystery_id UUID NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
  opened_evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  bookmarked_evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  investigation_notes TEXT NOT NULL DEFAULT '',
  selected_suspect_id TEXT,
  submitted_at TIMESTAMPTZ,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX investigations_mystery_id_idx ON investigations (mystery_id);
