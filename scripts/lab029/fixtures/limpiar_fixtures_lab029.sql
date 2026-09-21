BEGIN;
SET search_path TO vetatiende_documental, public;
DELETE FROM document_events WHERE event_id LIKE 'LAB029_TEST_%' OR document_id LIKE 'LAB029_TEST_%';
DELETE FROM document_versions WHERE version_id LIKE 'LAB029_TEST_%' OR document_id LIKE 'LAB029_TEST_%';
DELETE FROM documents WHERE document_id LIKE 'LAB029_TEST_%';
DELETE FROM clinics WHERE lower(clinic_id) LIKE 'lab029_test_%';
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM clinics WHERE lower(clinic_id) LIKE 'lab029_test_%')
    OR EXISTS (SELECT 1 FROM documents WHERE document_id LIKE 'LAB029_TEST_%')
    OR EXISTS (SELECT 1 FROM document_versions WHERE version_id LIKE 'LAB029_TEST_%')
    OR EXISTS (SELECT 1 FROM document_events WHERE event_id LIKE 'LAB029_TEST_%') THEN
    RAISE EXCEPTION 'lab029_fixture_residue';
  END IF;
END $$;
COMMIT;
