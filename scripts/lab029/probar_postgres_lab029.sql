-- Run after migrations 001 and 002, only in a test database.
-- All test data and test-only objects are rolled back.
BEGIN;
SET search_path TO vetatiende_documental, public;
INSERT INTO clinics(clinic_id,name,status,updated_at)
VALUES ('lab029_sql_test','LAB029_TEST SQL','active','2000-01-01');
INSERT INTO documents(document_id,clinic_id,document_type,visibility,updated_at)
VALUES ('LAB029_SQL_doc_a','lab029_sql_test','faq','public','2000-01-01'),
       ('LAB029_SQL_doc_b','lab029_sql_test','faq','public','2000-01-01');
INSERT INTO document_versions(version_id,document_id,version_number,content_hash,source_file,status)
VALUES ('LAB029_SQL_v1','LAB029_SQL_doc_a',1,repeat('a',64),'test/a','staging'),
       ('LAB029_SQL_v2','LAB029_SQL_doc_a',2,repeat('b',64),'test/b','staging'),
       ('LAB029_SQL_v3','LAB029_SQL_doc_a',3,repeat('c',64),'test/c','staging');

DO $$ BEGIN
  BEGIN
    INSERT INTO document_events(event_id,clinic_id,document_id,version_id,event_type,result)
    VALUES ('LAB029_SQL_cross','lab029_sql_test','LAB029_SQL_doc_b','LAB029_SQL_v1','no_changes','accepted');
    RAISE EXCEPTION 'FAIL cross-document event accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  INSERT INTO document_events(event_id,clinic_id,document_id,version_id,event_type,result)
  VALUES ('LAB029_SQL_null','lab029_sql_test','LAB029_SQL_doc_b',NULL,'failed','rejected');
  UPDATE clinics SET name='Updated',updated_at='1999-01-01' WHERE clinic_id='lab029_sql_test';
  UPDATE documents SET document_type='updated',updated_at='1999-01-01' WHERE document_id='LAB029_SQL_doc_a';
  IF NOT EXISTS (SELECT FROM clinics WHERE clinic_id='lab029_sql_test' AND updated_at>='2001-01-01')
    OR NOT EXISTS (SELECT FROM documents WHERE document_id='LAB029_SQL_doc_a' AND updated_at>='2001-01-01') THEN
    RAISE EXCEPTION 'FAIL automatic updated_at';
  END IF;
END $$;

UPDATE document_versions SET validated_at=now() WHERE version_id IN ('LAB029_SQL_v1','LAB029_SQL_v2');
SELECT activate_document_version('LAB029_SQL_v1');
-- Force an old activation to make the rollback timestamp assertion meaningful.
UPDATE document_versions SET activated_at='2000-01-01' WHERE version_id='LAB029_SQL_v1';
SELECT activate_document_version('LAB029_SQL_v2');
SELECT rollback_document_version('LAB029_SQL_doc_a','LAB029_SQL_v1');
UPDATE document_versions SET status='failed' WHERE version_id='LAB029_SQL_v3';
INSERT INTO document_events(event_id,clinic_id,document_id,version_id,event_type,result)
VALUES ('LAB029_SQL_unchanged','lab029_sql_test','LAB029_SQL_doc_a','LAB029_SQL_v1','no_changes','accepted');

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM document_versions WHERE version_id='LAB029_SQL_v1'
    AND status='active' AND activated_at=now() AND superseded_at IS NULL) THEN
    RAISE EXCEPTION 'FAIL rollback activation timestamp';
  END IF;
  IF EXISTS (
    SELECT expected.type FROM (VALUES ('staged',3),('validated',2),('activated',2),('failed',1),('rollback',1),('no_changes',1)) expected(type,n)
    LEFT JOIN document_events e ON e.event_type=expected.type AND e.document_id='LAB029_SQL_doc_a'
    GROUP BY expected.type,expected.n HAVING count(e.event_id)<>expected.n
  ) THEN RAISE EXCEPTION 'FAIL lifecycle audit counts'; END IF;
END $$;

CREATE FUNCTION reject_lab029_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.document_id='LAB029_SQL_doc_a' AND NEW.event_type IN ('activated','rollback') THEN
    RAISE EXCEPTION 'LAB029_TEST audit unavailable' USING ERRCODE='P0290';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reject_lab029_test_audit BEFORE INSERT ON document_events
  FOR EACH ROW EXECUTE FUNCTION reject_lab029_test_audit();

INSERT INTO document_versions(version_id,document_id,version_number,content_hash,source_file,status)
VALUES ('LAB029_SQL_v4','LAB029_SQL_doc_a',4,repeat('d',64),'test/d','staging');
UPDATE document_versions SET validated_at=now() WHERE version_id='LAB029_SQL_v4';
DO $$ DECLARE before_versions jsonb; before_events bigint; BEGIN
  SELECT jsonb_agg(to_jsonb(v) ORDER BY version_id) INTO before_versions FROM document_versions v WHERE document_id='LAB029_SQL_doc_a';
  SELECT count(*) INTO before_events FROM document_events;
  BEGIN
    PERFORM activate_document_version('LAB029_SQL_v4');
    RAISE EXCEPTION 'FAIL activation without audit';
  EXCEPTION WHEN SQLSTATE 'P0290' THEN NULL;
  END;
  BEGIN
    PERFORM rollback_document_version('LAB029_SQL_doc_a','LAB029_SQL_v2');
    RAISE EXCEPTION 'FAIL rollback without audit';
  EXCEPTION WHEN SQLSTATE 'P0290' THEN NULL;
  END;
  IF before_versions IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(v) ORDER BY version_id) FROM document_versions v WHERE document_id='LAB029_SQL_doc_a')
    OR before_events<>(SELECT count(*) FROM document_events) THEN
    RAISE EXCEPTION 'FAIL audit failure changed state';
  END IF;
END $$;
ROLLBACK;
SELECT 'PASS PostgreSQL LAB-029: FK, nullable version, updated_at, rollback timestamps, six events, atomic audit failures' AS result;
