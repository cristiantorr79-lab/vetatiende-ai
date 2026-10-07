WITH inserted AS (
  INSERT INTO vetatiende_documental.clinics (clinic_id, name, status)
  VALUES ('clinica_piloto_001', 'LAB030_QA Clínica Piloto 001', 'active')
  ON CONFLICT (clinic_id) DO NOTHING
  RETURNING clinic_id
)
SELECT
  c.clinic_id,
  c.name,
  c.status,
  CASE WHEN i.clinic_id IS NULL THEN 'ALREADY_EXISTS_UNCHANGED' ELSE 'CREATED' END AS fixture_result,
  (
    c.clinic_id = 'clinica_piloto_001'
    AND c.name = 'LAB030_QA Clínica Piloto 001'
    AND c.status = 'active'
  ) AS post_check_valid
FROM vetatiende_documental.clinics AS c
LEFT JOIN inserted AS i USING (clinic_id)
WHERE c.clinic_id = 'clinica_piloto_001';
