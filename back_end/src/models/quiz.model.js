import pool from "../config/db.js";

const createSession = async (studentId, topicId) => {
  const { rows } = await pool.query(
    `INSERT INTO quiz_sessions (student_id, topic_id, current_difficulty)
     VALUES ($1, $2, 2)
     RETURNING id, student_id, topic_id, status, current_difficulty,
       correct_streak, wrong_streak, started_at, finished_at`,
    [studentId, topicId],
  );
  return rows[0];
};

const findTopic = async (topicId) => {
  const { rows } = await pool.query(
    "SELECT id FROM topics WHERE id = $1 AND is_active = true",
    [topicId],
  );
  return rows[0] ?? null;
};

const findSession = async (sessionId, studentId, client = pool, lock = false) => {
  const lockClause = lock ? "FOR UPDATE" : "";
  const { rows } = await client.query(
    `SELECT id, student_id, topic_id, status, current_difficulty,
       correct_streak, wrong_streak, started_at, finished_at
     FROM quiz_sessions
     WHERE id = $1 AND student_id = $2
     ${lockClause}`,
    [sessionId, studentId],
  );
  return rows[0] ?? null;
};

const findNextQuestion = async (session) => {
  const { rows } = await pool.query(
    `SELECT q.id, q.topic_id, q.prompt, q.options, q.difficulty, q.explanation
     FROM questions q
     WHERE q.topic_id = $1
       AND q.is_active = true
       AND NOT EXISTS (
         SELECT 1 FROM attempts a
         WHERE a.session_id = $2 AND a.question_id = q.id
       )
     ORDER BY abs(q.difficulty - $3), q.difficulty, q.id
     LIMIT 1`,
    [session.topic_id, session.id, session.current_difficulty],
  );
  return rows[0] ?? null;
};

const findQuestionForTopic = async (client, questionId, topicId) => {
  const { rows } = await client.query(
    `SELECT id, topic_id, correct_answer, difficulty, explanation
     FROM questions
     WHERE id = $1 AND topic_id = $2 AND is_active = true
     FOR SHARE`,
    [questionId, topicId],
  );
  return rows[0] ?? null;
};

const hasAttempt = async (client, sessionId, questionId) => {
  const { rowCount } = await client.query(
    "SELECT 1 FROM attempts WHERE session_id = $1 AND question_id = $2",
    [sessionId, questionId],
  );
  return rowCount > 0;
};

const answerMatches = async (client, answer, correctAnswer) => {
  const { rows } = await client.query(
    "SELECT $1::jsonb = $2::jsonb AS is_correct",
    [JSON.stringify(answer), JSON.stringify(correctAnswer)],
  );
  return rows[0].is_correct;
};

const insertAttempt = async (client, { sessionId, studentId, questionId, answer, isCorrect }) => {
  const { rows } = await client.query(
    `INSERT INTO attempts (session_id, student_id, question_id, selected_answer, is_correct)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, session_id, student_id, question_id, selected_answer, is_correct, answered_at`,
    [sessionId, studentId, questionId, JSON.stringify(answer), isCorrect],
  );
  return rows[0];
};

const updateSessionProgress = async (client, sessionId, studentId, progress) => {
  const { rows } = await client.query(
    `UPDATE quiz_sessions
     SET current_difficulty = $3, correct_streak = $4, wrong_streak = $5
     WHERE id = $1 AND student_id = $2
     RETURNING current_difficulty, correct_streak, wrong_streak`,
    [
      sessionId,
      studentId,
      progress.current_difficulty,
      progress.correct_streak,
      progress.wrong_streak,
    ],
  );
  return rows[0];
};

const upsertAbilityScore = async (client, studentId, topicId, initialScore, scoreDelta) => {
  const { rows } = await client.query(
    `INSERT INTO ability_scores (student_id, topic_id, score, questions_answered)
     VALUES ($1, $2, $3, 1)
     ON CONFLICT (student_id, topic_id) DO UPDATE
     SET score = GREATEST(0, LEAST(100, ability_scores.score + $4)),
         questions_answered = ability_scores.questions_answered + 1,
         updated_at = now()
     RETURNING score, questions_answered, updated_at`,
    [studentId, topicId, initialScore, scoreDelta],
  );
  return rows[0];
};

const getSummary = async (client, session) => {
  const { rows } = await client.query(
    `SELECT count(*)::integer AS total_questions,
       count(*) FILTER (WHERE is_correct)::integer AS correct_answers,
       count(*) FILTER (WHERE NOT is_correct)::integer AS incorrect_answers
     FROM attempts WHERE session_id = $1`,
    [session.id],
  );
  return rows[0];
};

const finishSession = async (client, sessionId, studentId) => {
  const { rows } = await client.query(
    `UPDATE quiz_sessions
     SET status = 'finished', finished_at = COALESCE(finished_at, now())
     WHERE id = $1 AND student_id = $2 AND status = 'active'
     RETURNING id, student_id, topic_id, status, current_difficulty,
       correct_streak, wrong_streak, started_at, finished_at`,
    [sessionId, studentId],
  );
  return rows[0] ?? null;
};

export {
  pool,
  createSession,
  findTopic,
  findSession,
  findNextQuestion,
  findQuestionForTopic,
  hasAttempt,
  answerMatches,
  insertAttempt,
  updateSessionProgress,
  upsertAbilityScore,
  getSummary,
  finishSession,
};
