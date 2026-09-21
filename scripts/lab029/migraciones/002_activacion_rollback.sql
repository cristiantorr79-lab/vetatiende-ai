BEGIN;
SET search_path TO vetatiende_documental, public;

CREATE SEQUENCE IF NOT EXISTS document_event_sequence;

CREATE OR REPLACE FUNCTION record_version_event(p_version_id text, p_type text)
RETURNS void LANGUAGE plpgsql SET search_path TO vetatiende_documental, pg_temp AS $$
BEGIN
  INSERT INTO document_events(event_id, clinic_id, document_id, version_id, event_type, result)
  SELECT 'lab029_evt_' || nextval('document_event_sequence'), d.clinic_id,
    v.document_id, v.version_id, p_type, CASE WHEN p_type='failed' THEN 'rejected' ELSE 'accepted' END
  FROM document_versions v JOIN documents d USING(document_id)
  WHERE v.version_id=p_version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'event_version_not_found'; END IF;
END $$;

-- PostgreSQL owns lifecycle events; callers must not insert duplicates.
CREATE OR REPLACE FUNCTION audit_version_transition()
RETURNS trigger LANGUAGE plpgsql SET search_path TO vetatiende_documental, pg_temp AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.status='staging' THEN PERFORM record_version_event(NEW.version_id, 'staged'); END IF;
  ELSE
    IF OLD.validated_at IS NULL AND NEW.validated_at IS NOT NULL THEN
      PERFORM record_version_event(NEW.version_id, 'validated');
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status='failed' THEN
      PERFORM record_version_event(NEW.version_id, 'failed');
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS version_lifecycle_events ON document_versions;
CREATE TRIGGER version_lifecycle_events AFTER INSERT OR UPDATE ON document_versions
  FOR EACH ROW EXECUTE FUNCTION audit_version_transition();

CREATE OR REPLACE FUNCTION activate_document_version(p_version_id text)
RETURNS void LANGUAGE plpgsql SET search_path TO vetatiende_documental, pg_temp AS $$
DECLARE v document_versions%ROWTYPE;
BEGIN
  SELECT * INTO v FROM document_versions WHERE version_id = p_version_id FOR UPDATE;
  IF NOT FOUND OR v.status <> 'staging' OR v.validated_at IS NULL THEN
    RAISE EXCEPTION 'version_not_validated_staging';
  END IF;
  PERFORM 1 FROM documents WHERE document_id = v.document_id FOR UPDATE;
  UPDATE document_versions SET status='superseded', superseded_at=now()
    WHERE document_id=v.document_id AND status='active';
  UPDATE document_versions SET status='active', activated_at=now(), superseded_at=NULL
    WHERE version_id=p_version_id;
  PERFORM record_version_event(p_version_id, 'activated');
END $$;

CREATE OR REPLACE FUNCTION rollback_document_version(p_document_id text, p_target_version_id text)
RETURNS void LANGUAGE plpgsql SET search_path TO vetatiende_documental, pg_temp AS $$
DECLARE v document_versions%ROWTYPE;
BEGIN
  PERFORM 1 FROM documents WHERE document_id=p_document_id FOR UPDATE;
  SELECT * INTO v FROM document_versions
    WHERE version_id=p_target_version_id AND document_id=p_document_id FOR UPDATE;
  IF NOT FOUND OR v.status NOT IN ('superseded','active') OR v.validated_at IS NULL THEN
    RAISE EXCEPTION 'rollback_target_invalid';
  END IF;
  UPDATE document_versions SET status='superseded', superseded_at=now()
    WHERE document_id=p_document_id AND status='active' AND version_id<>p_target_version_id;
  UPDATE document_versions SET status='active', activated_at=now(), superseded_at=NULL
    WHERE version_id=p_target_version_id;
  PERFORM record_version_event(p_target_version_id, 'rollback');
END $$;

COMMIT;
