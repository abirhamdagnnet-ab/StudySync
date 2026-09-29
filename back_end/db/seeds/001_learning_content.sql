INSERT INTO subjects (name, description)
VALUES
  ('Mathematics', 'Number skills, algebra, and geometry.'),
  ('Natural Science', 'Foundational biology and physics.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO topics (subject_id, name, description)
SELECT subjects.id, topic_data.name, topic_data.description
FROM (VALUES
  ('Mathematics', 'Arithmetic', 'Addition and number operations.'),
  ('Mathematics', 'Algebra', 'Expressions and solving for unknowns.'),
  ('Mathematics', 'Geometry', 'Perimeter and geometric measurement.'),
  ('Natural Science', 'Biology', 'Basic facts about living things.'),
  ('Natural Science', 'Physics', 'Distance, speed, and time.')
) AS topic_data(subject_name, name, description)
JOIN subjects ON subjects.name = topic_data.subject_name
ON CONFLICT (subject_id, name) DO UPDATE SET description = EXCLUDED.description;

WITH topic_questions AS (
  SELECT
    topics.id AS topic_id,
    topics.name AS topic_name,
    question_number,
    CASE topics.name
      WHEN 'Arithmetic' THEN question_number + 1 + (question_number % 4) + 2
      WHEN 'Algebra' THEN question_number + (question_number % 4) + 2
      WHEN 'Geometry' THEN 4 * (question_number + 1)
      WHEN 'Biology' THEN 6 * question_number
      WHEN 'Physics' THEN 10 * question_number * question_number
    END AS answer_value,
    ((question_number - 1) % 3) + 1 AS difficulty
  FROM topics
  CROSS JOIN generate_series(1, 12) AS series(question_number)
  WHERE topics.name IN ('Arithmetic', 'Algebra', 'Geometry', 'Biology', 'Physics')
), question_content AS (
  SELECT
    topic_id,
    answer_value,
    difficulty,
    CASE topic_name
      WHEN 'Arithmetic' THEN format('What is %s + %s?', question_number + 1, (question_number % 4) + 2)
      WHEN 'Algebra' THEN format('Solve for x: x + %s = %s.', (question_number % 4) + 2, answer_value)
      WHEN 'Geometry' THEN format('What is the perimeter of a square with side length %s?', question_number + 1)
      WHEN 'Biology' THEN format('If one insect has 6 legs, how many legs do %s insects have?', question_number)
      WHEN 'Physics' THEN format('A vehicle travels %s km/h for %s hours. How far does it travel?', 10 * question_number, question_number)
    END AS prompt,
    CASE topic_name
      WHEN 'Arithmetic' THEN format('%s plus %s equals %s.', question_number + 1, (question_number % 4) + 2, answer_value)
      WHEN 'Algebra' THEN format('Subtract %s from both sides; x equals %s.', (question_number % 4) + 2, answer_value - ((question_number % 4) + 2))
      WHEN 'Geometry' THEN format('A square has four equal sides, so 4 times %s equals %s.', question_number + 1, answer_value)
      WHEN 'Biology' THEN format('Multiply 6 legs by %s insects to get %s legs.', question_number, answer_value)
      WHEN 'Physics' THEN format('Distance equals speed times time: %s times %s equals %s km.', 10 * question_number, question_number, answer_value)
    END AS explanation
  FROM topic_questions
)
INSERT INTO questions (topic_id, prompt, options, correct_answer, difficulty, explanation)
SELECT
  question_content.topic_id,
  question_content.prompt,
  jsonb_build_array(
    question_content.answer_value,
    question_content.answer_value + 1,
    question_content.answer_value + 2,
    greatest(question_content.answer_value - 1, 0)
  ),
  to_jsonb(question_content.answer_value),
  question_content.difficulty,
  question_content.explanation
FROM question_content
WHERE NOT EXISTS (
  SELECT 1
  FROM questions existing
  WHERE existing.topic_id = question_content.topic_id
    AND existing.prompt = question_content.prompt
);