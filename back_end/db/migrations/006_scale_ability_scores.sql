ALTER TABLE ability_scores
  DROP CONSTRAINT ability_scores_score_check;

ALTER TABLE ability_scores
  ALTER COLUMN score TYPE numeric(6, 2) USING score * 100,
  ALTER COLUMN score SET DEFAULT 50;

ALTER TABLE ability_scores
  ADD CONSTRAINT ability_scores_score_check CHECK (score BETWEEN 0 AND 100);