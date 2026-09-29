CREATE TABLE study_materials (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id bigint NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
  topic_id bigint REFERENCES topics(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  file_path text NOT NULL UNIQUE,
  mime_type text NOT NULL CHECK (
    mime_type IN (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    )
  ),
  size bigint NOT NULL CHECK (size BETWEEN 1 AND 10485760),
  extracted_text text NOT NULL CHECK (length(btrim(extracted_text)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX study_materials_student_created_idx ON study_materials (student_id, created_at DESC);
CREATE INDEX study_materials_subject_idx ON study_materials (subject_id);
CREATE INDEX study_materials_topic_idx ON study_materials (topic_id);