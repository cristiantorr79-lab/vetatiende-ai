\set ON_ERROR_STOP on

BEGIN;
SET LOCAL search_path TO vetatiende_documental, public;

DO $cleanup$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM clinics
    WHERE clinic_id = 'clinica_piloto_001'
      AND name IS DISTINCT FROM 'LAB030_QA Clínica Piloto 001'
  ) THEN
    RAISE EXCEPTION 'LAB030_QA_CLINIC_NOT_OWNED_BY_FIXTURE';
  END IF;

  IF EXISTS (
    SELECT 1 FROM documents WHERE clinic_id = 'clinica_piloto_001'
  ) OR EXISTS (
    SELECT 1 FROM document_events WHERE clinic_id = 'clinica_piloto_001'
  ) THEN
    RAISE EXCEPTION 'LAB030_QA_CLINIC_HAS_DEPENDENCIES';
  END IF;
END
$cleanup$;

WITH deleted AS (
  DELETE FROM clinics
  WHERE clinic_id = 'clinica_piloto_001'
    AND name = 'LAB030_QA Clínica Piloto 001'
  RETURNING clinic_id
)
SELECT
  'clinica_piloto_001'::text AS clinic_id,
  CASE WHEN EXISTS (SELECT 1 FROM deleted) THEN 'DELETED' ELSE 'ALREADY_ABSENT' END AS cleanup_result,
  NOT EXISTS (
    SELECT 1 FROM clinics WHERE clinic_id = 'clinica_piloto_001'
  ) AS post_check_zero;

COMMIT;
