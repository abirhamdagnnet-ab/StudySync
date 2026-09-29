import pool from "../config/db.js";

const columns = "id, subject_id, name, description, is_active, created_at";

const list = async (subjectId = null) => {
  const { rows } = await pool.query(
    `SELECT ${columns} FROM topics
     WHERE ($1::bigint IS NULL OR subject_id = $1)
     ORDER BY id`,
    [subjectId],
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`SELECT ${columns} FROM topics WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

const create = async ({ subject_id: subjectId, name, description = null }) => {
  const { rows } = await pool.query(
    `INSERT INTO topics (subject_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING ${columns}`,
    [subjectId, name, description],
  );
  return rows[0];
};

const update = async (id, { subject_id: subjectId, name, description = null }) => {
  const { rows } = await pool.query(
    `UPDATE topics SET subject_id = $2, name = $3, description = $4
     WHERE id = $1
     RETURNING ${columns}`,
    [id, subjectId, name, description],
  );
  return rows[0] ?? null;
};

const remove = async (id) => {
  const { rows } = await pool.query(`DELETE FROM topics WHERE id = $1 RETURNING id`, [id]);
  return rows[0] ?? null;
};

export { list, findById, create, update, remove };