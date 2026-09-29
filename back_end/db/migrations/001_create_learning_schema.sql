CREATE TABLE users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT users_email_not_empty CHECK (length(btrim(email)) > 0)
);

CREATE TABLE subjects (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE topics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id bigint NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topics_subject_name_unique UNIQUE (subject_id, name)
);

CREATE TABLE questions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id bigint NOT NULL REFERENCES topics(id) ON DELETE RESTRICT,
  prompt text NOT NULL CHECK (length(btrim(prompt)) > 0),
  options jsonb NOT NULL CHECK (jsonb_typeof(options) = 'array'),
  difficulty smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  created_by bigint REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL CHECK (length(btrim(name)) > 0),
  teacher_id bigint REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE class_students (
  class_id bigint NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

CREATE TABLE quiz_sessions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id bigint REFERENCES classes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  current_difficulty smallint NOT NULL DEFAULT 1 CHECK (current_difficulty BETWEEN 1 AND 3),
  correct_streak integer NOT NULL DEFAULT 0 CHECK (correct_streak >= 0),
  wrong_streak integer NOT NULL DEFAULT 0 CHECK (wrong_streak >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  CONSTRAINT quiz_sessions_id_student_unique UNIQUE (id, student_id),
  CONSTRAINT quiz_sessions_finished_at_check CHECK (
    (status = 'active' AND finished_at IS NULL)
    OR (status = 'finished' AND finished_at IS NOT NULL)
  )
);

CREATE TABLE attempts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id bigint NOT NULL,
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id bigint NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  selected_answer jsonb,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attempts_session_student_fk
    FOREIGN KEY (session_id, student_id)
    REFERENCES quiz_sessions(id, student_id)
    ON DELETE CASCADE,
  CONSTRAINT attempts_session_question_unique UNIQUE (session_id, question_id)
);

CREATE TABLE ability_scores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id bigint NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  score numeric(5, 4) NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 1),
  questions_answered integer NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ability_scores_student_topic_unique UNIQUE (student_id, topic_id)
);

CREATE INDEX questions_topic_difficulty_idx ON questions (topic_id, difficulty);
CREATE INDEX class_students_student_idx ON class_students (student_id);
CREATE INDEX quiz_sessions_student_status_idx ON quiz_sessions (student_id, status);
CREATE INDEX attempts_student_answered_at_idx ON attempts (student_id, answered_at);
CREATE INDEX attempts_student_question_idx ON attempts (student_id, question_id);