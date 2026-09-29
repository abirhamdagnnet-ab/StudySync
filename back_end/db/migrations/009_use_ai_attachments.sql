ALTER TABLE study_materials RENAME TO ai_attachments;
ALTER TABLE ai_conversations RENAME COLUMN material_id TO attachment_id;
ALTER TABLE ai_conversations
  RENAME CONSTRAINT ai_conversations_material_id_fkey TO ai_conversations_attachment_id_fkey;

ALTER TABLE ai_attachments DROP COLUMN subject_id;
ALTER TABLE ai_attachments DROP COLUMN topic_id;

ALTER INDEX study_materials_student_created_idx RENAME TO ai_attachments_student_created_idx;
