import pool from "../config/db.js";

const getWeakTopicsForStudent = async (studentId) => {
  const { rows } = await pool.query(
    `WITH ranked_attempts AS (
       SELECT topics.id AS topic_id, topics.name AS topic_name,
         attempts.is_correct,
         row_number() OVER (
           PARTITION BY topics.id
           ORDER BY attempts.answered_at DESC, attempts.id DESC
         ) AS attempt_rank
       FROM attempts
       JOIN questions ON questions.id = attempts.question_id
       JOIN topics ON topics.id = questions.topic_id
       WHERE attempts.student_id = $1
     ), recent_topic_accuracy AS (
       SELECT topic_id, topic_name, count(*)::integer AS attempts_count,
         round(100.0 * count(*) FILTER (WHERE is_correct) / count(*), 2) AS accuracy
       FROM ranked_attempts
       WHERE attempt_rank <= 10
       GROUP BY topic_id, topic_name
       HAVING count(*) >= 3
     )
     SELECT topic_id, topic_name, attempts_count, accuracy
     FROM recent_topic_accuracy
     ORDER BY accuracy ASC, topic_name ASC`,
    [studentId],
  );
  return rows;
};

const getWeakTopicDetail = async (studentId, topicId) => {
  const { rows: topicRows } = await pool.query(
    `WITH ranked_attempts AS (
       SELECT attempts.id, attempts.is_correct,
         row_number() OVER (ORDER BY attempts.answered_at DESC, attempts.id DESC) AS attempt_rank
       FROM attempts
       JOIN questions ON questions.id = attempts.question_id
       WHERE attempts.student_id = $1 AND questions.topic_id = $2
     )
     SELECT topics.id AS topic_id, topics.name AS topic_name,
       count(ranked_attempts.id)::integer AS total_attempts,
       count(*) FILTER (WHERE ranked_attempts.attempt_rank <= 10)::integer AS recent_attempts,
       round(
         100.0 * count(*) FILTER (
           WHERE ranked_attempts.attempt_rank <= 10 AND ranked_attempts.is_correct
         ) / NULLIF(count(*) FILTER (WHERE ranked_attempts.attempt_rank <= 10), 0),
         2
       ) AS recent_accuracy
     FROM topics
     LEFT JOIN ranked_attempts ON true
     WHERE topics.id = $2
     GROUP BY topics.id, topics.name`,
    [studentId, topicId],
  );
  if (!topicRows[0]) return null;
  if (topicRows[0].total_attempts === 0) return { ...topicRows[0], recent_wrong_answers: [] };

  const { rows: wrongAnswers } = await pool.query(
    `SELECT questions.prompt, attempts.selected_answer,
       questions.correct_answer, questions.explanation, attempts.answered_at
     FROM attempts
     JOIN questions ON questions.id = attempts.question_id
     WHERE attempts.student_id = $1
       AND questions.topic_id = $2
       AND attempts.is_correct = false
     ORDER BY attempts.answered_at DESC, attempts.id DESC
     LIMIT 5`,
    [studentId, topicId],
  );

  return { ...topicRows[0], recent_wrong_answers: wrongAnswers };
};

const getProgressForStudent = async (studentId) => {
  const [topicsResult, timelineResult] = await Promise.all([
    pool.query(
      `WITH topic_attempts AS (
         SELECT questions.topic_id,
           count(*)::integer AS attempts_count,
           count(*) FILTER (WHERE attempts.is_correct)::integer AS correct_count,
           round(100.0 * count(*) FILTER (WHERE attempts.is_correct) / count(*), 2) AS accuracy
         FROM attempts
         JOIN questions ON questions.id = attempts.question_id
         WHERE attempts.student_id = $1
         GROUP BY questions.topic_id
       )
       SELECT topics.id AS topic_id, topics.name AS topic_name,
         COALESCE(ability_scores.score, 50)::numeric AS ability_score,
         COALESCE(topic_attempts.attempts_count, 0)::integer AS attempts_count,
         COALESCE(topic_attempts.correct_count, 0)::integer AS correct_count,
         COALESCE(topic_attempts.accuracy, 0)::numeric AS accuracy
       FROM topics
       LEFT JOIN ability_scores
         ON ability_scores.topic_id = topics.id AND ability_scores.student_id = $1
       LEFT JOIN topic_attempts ON topic_attempts.topic_id = topics.id
       WHERE ability_scores.student_id IS NOT NULL OR topic_attempts.topic_id IS NOT NULL
       ORDER BY topics.name`,
      [studentId],
    ),
    pool.query(
      `SELECT date_trunc('day', attempts.answered_at) AS date,
         count(*)::integer AS attempts_count,
         count(*) FILTER (WHERE attempts.is_correct)::integer AS correct_count,
         round(100.0 * count(*) FILTER (WHERE attempts.is_correct) / count(*), 2) AS accuracy
       FROM attempts
       WHERE attempts.student_id = $1
       GROUP BY date_trunc('day', attempts.answered_at)
       ORDER BY date ASC`,
      [studentId],
    ),
  ]);

  return {
    topics: topicsResult.rows,
    accuracy_over_time: timelineResult.rows,
  };
};

const findAccessibleClass = async (classId, teacherId, isAdmin) => {
  const { rows } = await pool.query(
    `SELECT id FROM classes
     WHERE id = $1 AND ($3::boolean OR teacher_id = $2)`,
    [classId, teacherId, isAdmin],
  );
  return rows[0] ?? null;
};

const getClassTopicTrends = async (classId) => {
  const { rows } = await pool.query(
    `WITH student_topic_accuracy AS (
       SELECT attempts.student_id, questions.topic_id,
         count(*)::integer AS attempts_count,
         avg(CASE WHEN attempts.is_correct THEN 100.0 ELSE 0.0 END) AS accuracy
       FROM attempts
       JOIN class_students ON class_students.student_id = attempts.student_id
       JOIN questions ON questions.id = attempts.question_id
       WHERE class_students.class_id = $1
       GROUP BY attempts.student_id, questions.topic_id
     ), class_topic_accuracy AS (
       SELECT topic_id, sum(attempts_count)::integer AS attempts_count,
         count(*)::integer AS students_count,
         round(avg(accuracy), 2) AS average_accuracy
       FROM student_topic_accuracy
       GROUP BY topic_id
       HAVING sum(attempts_count) >= 3
     )
     SELECT topics.id AS topic_id, topics.name AS topic_name,
       class_topic_accuracy.attempts_count,
       class_topic_accuracy.students_count,
       class_topic_accuracy.average_accuracy
     FROM class_topic_accuracy
     JOIN topics ON topics.id = class_topic_accuracy.topic_id
     ORDER BY class_topic_accuracy.average_accuracy ASC, topics.name ASC`,
    [classId],
  );
  return rows;
};

export {
  getWeakTopicsForStudent,
  getWeakTopicDetail,
  getProgressForStudent,
  findAccessibleClass,
  getClassTopicTrends,
};