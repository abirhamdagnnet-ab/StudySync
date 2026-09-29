ALTER TABLE quiz_sessions
  ADD COLUMN topic_id bigint NOT NULL REFERENCES topics(id) ON DELETE RESTRICT;

CREATE INDEX quiz_sessions_topic_status_idx ON quiz_sessions (topic_id, status);