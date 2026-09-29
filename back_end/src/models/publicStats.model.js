import pool from "../config/db.js";

const getStats = async () => {
  const { rows } = await pool.query(
    `SELECT
       count(*) FILTER (WHERE role = 'student' AND is_active)::integer AS students,
       count(*) FILTER (WHERE role = 'teacher' AND is_active)::integer AS teachers,
       (SELECT count(*)::integer FROM questions WHERE is_active) AS questions,
       (SELECT count(*)::integer FROM attempts) AS quiz_attempts
     FROM users`,
  );
  return rows[0];
};

export { getStats };
