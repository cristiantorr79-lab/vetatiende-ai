BEGIN;
SET search_path TO vetatiende_documental, public;
INSERT INTO clinics(clinic_id,name,status) VALUES
  ('lab029_test_clinic_a','LAB029_TEST Clínica A','active'),
  ('lab029_test_clinic_b','LAB029_TEST Clínica B','active')
ON CONFLICT (clinic_id) DO UPDATE SET name=EXCLUDED.name,status=EXCLUDED.status,updated_at=now();
INSERT INTO documents(document_id,clinic_id,document_type,visibility,access_level,status) VALUES
  ('LAB029_TEST_public_a','lab029_test_clinic_a','faq','public',NULL,'active'),
  ('LAB029_TEST_internal_a','lab029_test_clinic_a','protocol','internal','veterinario','active'),
  ('LAB029_TEST_public_b','lab029_test_clinic_b','faq','public',NULL,'active')
ON CONFLICT (document_id) DO NOTHING;
COMMIT;
