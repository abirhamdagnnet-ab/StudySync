import pool from "../config/db.js";

const publicColumns = "id, email, role, is_active, created_at, updated_at";

const findByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT ${publicColumns}, password_hash FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  return rows[0] ?? null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT ${publicColumns} FROM users WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

const create = async ({ email, passwordHash }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'student')
     RETURNING ${publicColumns}`,
    [email.trim().toLowerCase(), passwordHash],
  );
  return rows[0];
};

const createManagedUser = async ({ email, passwordHash, role }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING ${publicColumns}`,
    [email.trim().toLowerCase(), passwordHash, role],
  );
  return rows[0];
};

const listUsers = async () => {
  const { rows } = await pool.query(
    `SELECT ${publicColumns} FROM users ORDER BY id`,
  );
  return rows;
};

const setActiveStatus = async (id, isActive) => {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = $2, updated_at = now()
     WHERE id = $1
     RETURNING ${publicColumns}`,
    [id, isActive],
  );
  return rows[0] ?? null;
};

export { findByEmail, findById, create, createManagedUser, listUsers, setActiveStatus };