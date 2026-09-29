ALTER TABLE classes
  ADD COLUMN subject_id bigint REFERENCES subjects(id) ON DELETE RESTRICT;

CREATE INDEX classes_teacher_id_idx ON classes (teacher_id);
CREATE INDEX classes_subject_id_idx ON classes (subject_id);