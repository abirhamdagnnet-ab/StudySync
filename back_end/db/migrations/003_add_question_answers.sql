ALTER TABLE questions
  ADD COLUMN correct_answer jsonb,
  ADD COLUMN explanation text;

CREATE FUNCTION question_options_contain(options_value jsonb, answer_value jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(options_value) AS option_value(value)
    WHERE option_value.value = answer_value
  );
$$;

ALTER TABLE questions
  ADD CONSTRAINT questions_options_count_check
    CHECK (jsonb_array_length(options) BETWEEN 2 AND 6) NOT VALID,
  ADD CONSTRAINT questions_answer_explanation_check
    CHECK (
      correct_answer IS NOT NULL
      AND question_options_contain(options, correct_answer)
      AND explanation IS NOT NULL
      AND length(btrim(explanation)) > 0
    ) NOT VALID;

CREATE INDEX topics_subject_id_idx ON topics (subject_id);