import pool from "../config/db.js";

const getStats = async () => {
  const [users, questions, sessions, topics, recentUsers] = await Promise.all([
    pool.query(
      `SELECT count(*)::integer AS total_users,
         count(*) FILTER (WHERE role = 'student')::integer AS students,
         count(*) FILTER (WHERE role = 'teacher')::integer AS teachers,
         count(*) FILTER (WHERE role = 'admin')::integer AS admins
       FROM users`,
    ),
    pool.query("SELECT count(*)::integer AS total_questions FROM questions"),
    pool.query("SELECT count(*)::integer AS total_quiz_sessions FROM quiz_sessions"),
    pool.query(
      `SELECT topics.id AS topic_id, topics.name AS topic_name,
         count(questions.id)::integer AS question_count
       FROM topics
       LEFT JOIN questions ON questions.topic_id = topics.id
       GROUP BY topics.id, topics.name
       ORDER BY topics.name`,
    ),
    pool.query(
      `SELECT id, email, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC, id DESC
       LIMIT 6`,
    ),
  ]);

  return {
    ...users.rows[0],
    total_questions: questions.rows[0].total_questions,
    total_quiz_sessions: sessions.rows[0].total_quiz_sessions,
    questions_per_topic: topics.rows,
    recent_users: recentUsers.rows,
  };
};

export { getStats };