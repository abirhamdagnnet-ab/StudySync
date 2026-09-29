import pool from "../config/db.js";

const columns = "id, name, description, is_active, created_at";

const list = async () => {
  const { rows } = await pool.query(`SELECT ${columns} FROM subjects ORDER BY id`);
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`SELECT ${columns} FROM subjects WHERE id = $1`, [id]);
  return rows[0] ?? null;
};

const create = async ({ name, description = null }) => {
  const { rows } = await pool.query(
    `INSERT INTO subjects (name, description) VALUES ($1, $2) RETURNING ${columns}`,
    [name, description],
  );
  return rows[0];
};

const update = async (id, { name, description = null }) => {
  const { rows } = await pool.query(
    `UPDATE subjects SET name = $2, description = $3 WHERE id = $1 RETURNING ${columns}`,
    [id, name, description],
  );
  return rows[0] ?? null;
};

const remove = async (id) => {
  const { rows } = await pool.query(`DELETE FROM subjects WHERE id = $1 RETURNING id`, [id]);
  return rows[0] ?? null;
};

export { list, findById, create, update, remove };