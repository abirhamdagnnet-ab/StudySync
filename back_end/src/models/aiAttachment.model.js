import pool from "../config/db.js";

const create = async ({ studentId, title, filePath, mimeType, size, extractedText }) => {
  const { rows } = await pool.query(
    `INSERT INTO ai_attachments
       (student_id, title, file_path, mime_type, size, extracted_text)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, student_id, title, mime_type, size, created_at`,
    [studentId, title, filePath, mimeType, size, extractedText],
  );
  return rows[0];
};

const deleteForStudent = async (id, studentId) => {
  const { rows } = await pool.query(
    "DELETE FROM ai_attachments WHERE id = $1 AND student_id = $2 RETURNING id",
    [id, studentId],
  );
  return rows[0] ?? null;
};

export { create, deleteForStudent };
