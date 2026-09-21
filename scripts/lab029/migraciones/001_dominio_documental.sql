BEGIN;

CREATE SCHEMA IF NOT EXISTS vetatiende_documental;
SET search_path TO vetatiende_documental, public;

CREATE TABLE IF NOT EXISTS clinics (
  clinic_id text PRIMARY KEY CHECK (clinic_id ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  name text NOT NULL CHECK (btrim(name) <> ''),
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  document_id text PRIMARY KEY CHECK (document_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,95}$'),
  clinic_id text NOT NULL REFERENCES clinics(clinic_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  document_type text NOT NULL CHECK (btrim(document_type) <> ''),
  visibility text NOT NULL CHECK (visibility IN ('public', 'internal')),
  access_level text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_access_by_visibility CHECK (
    (visibility = 'public' AND access_level IS NULL) OR
    (visibility = 'internal' AND access_level IS NOT NULL AND btrim(access_level) <> '')
  ),
  UNIQUE (document_id, clinic_id)
);

CREATE TABLE IF NOT EXISTS document_versions (
  version_id text PRIMARY KEY CHECK (version_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$'),
  document_id text NOT NULL REFERENCES documents(document_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  version_number integer NOT NULL CHECK (version_number > 0),
  content_hash text NOT NULL CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  source_file text NOT NULL CHECK (btrim(source_file) <> '' AND source_file !~ '(^|[\\/])\.\.[\\/]'),
  status text NOT NULL CHECK (status IN ('staging', 'active', 'superseded', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz,
  activated_at timestamptz,
  superseded_at timestamptz,
  UNIQUE (document_id, version_number),
  UNIQUE (document_id, content_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_version_per_document
  ON document_versions(document_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS documents_by_clinic_visibility
  ON documents(clinic_id, visibility, status);
CREATE INDEX IF NOT EXISTS versions_by_document_status
  ON document_versions(document_id, status, version_number DESC);

CREATE TABLE IF NOT EXISTS document_events (
  event_id text PRIMARY KEY CHECK (event_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$'),
  clinic_id text NOT NULL REFERENCES clinics(clinic_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  document_id text NOT NULL,
  version_id text,
  event_type text NOT NULL CHECK (event_type IN ('staged', 'no_changes', 'validated', 'activated', 'failed', 'rollback')),
  result text NOT NULL CHECK (result IN ('accepted', 'rejected', 'uncertain')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (document_id, clinic_id) REFERENCES documents(document_id, clinic_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (version_id) REFERENCES document_versions(version_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Also upgrades an existing local LAB-029 schema; inconsistent rows abort the migration.
CREATE UNIQUE INDEX IF NOT EXISTS versions_document_version
  ON document_versions(document_id, version_id);
ALTER TABLE document_events DROP CONSTRAINT IF EXISTS document_events_version_id_fkey;
ALTER TABLE document_events DROP CONSTRAINT IF EXISTS events_document_version_fk;
ALTER TABLE document_events ADD CONSTRAINT events_document_version_fk
  FOREIGN KEY (document_id, version_id)
  REFERENCES document_versions(document_id, version_id) ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS clinics_updated_at ON clinics;
CREATE TRIGGER clinics_updated_at BEFORE UPDATE ON clinics
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS documents_updated_at ON documents;
CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;
