CREATE TABLE ai_conversations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  material_id bigint REFERENCES study_materials(id) ON DELETE SET NULL,
  topic_id bigint REFERENCES topics(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL CHECK (length(btrim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ai_usage (
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 30),
  PRIMARY KEY (student_id, date)
);

CREATE INDEX ai_conversations_student_created_idx ON ai_conversations (student_id, created_at DESC);
CREATE INDEX ai_messages_conversation_created_idx ON ai_messages (conversation_id, created_at, id);