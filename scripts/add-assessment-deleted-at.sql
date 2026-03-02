-- Add soft-delete column to project_assessments for data recovery
-- Run once on existing databases: npx tsx scripts/run-add-assessment-deleted-at.ts

ALTER TABLE project_assessments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

COMMENT ON COLUMN project_assessments.deleted_at IS 'When set, assessment is hidden from lists and detail; restore by setting to NULL';
