import pool from "../config/db.js";

const consumeDailyRequest = async (studentId) => {
  const { rows } = await pool.query(
    `INSERT INTO ai_usage (student_id, date, request_count)
     VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (student_id, date) DO UPDATE
     SET request_count = ai_usage.request_count + 1
     WHERE ai_usage.request_count < 30
     RETURNING request_count`,
    [studentId],
  );
  return rows[0] ?? null;
};

export { consumeDailyRequest };