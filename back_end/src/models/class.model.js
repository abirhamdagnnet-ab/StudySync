import pool from "../config/db.js";

const classColumns = "id, name, subject_id, teacher_id, is_active, created_at, updated_at";

const listForTeacher = async (teacherId, isAdmin) => {
  const { rows } = await pool.query(
    `SELECT ${classColumns} FROM classes
     WHERE ($1::boolean OR teacher_id = $2)
     ORDER BY id`,
    [isAdmin, teacherId],
  );
  return rows;
};

const create = async ({ name, subjectId, teacherId }) => {
  const { rows } = await pool.query(
    `INSERT INTO classes (name, subject_id, teacher_id)
     VALUES ($1, $2, $3)
     RETURNING ${classColumns}`,
    [name, subjectId, teacherId],
  );
  return rows[0];
};

const findAccessibleById = async (id, teacherId, isAdmin) => {
  const { rows } = await pool.query(
    `SELECT ${classColumns} FROM classes
     WHERE id = $1 AND ($2::boolean OR teacher_id = $3)`,
    [id, isAdmin, teacherId],
  );
  return rows[0] ?? null;
};

const listStudents = async (classId) => {
  const { rows } = await pool.query(
    `SELECT users.id, users.email, users.is_active, class_students.enrolled_at
     FROM class_students
     JOIN users ON users.id = class_students.student_id
     WHERE class_students.class_id = $1
     ORDER BY users.email`,
    [classId],
  );
  return rows;
};

const addStudentByEmail = async (classId, email) => {
  const { rows } = await pool.query(
    `INSERT INTO class_students (class_id, student_id)
     SELECT $1, users.id
     FROM users
     WHERE users.email = $2 AND users.role = 'student' AND users.is_active = true
     ON CONFLICT (class_id, student_id) DO NOTHING
     RETURNING class_id, student_id, enrolled_at`,
    [classId, email.trim().toLowerCase()],
  );
  return rows[0] ?? null;
};

const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    "SELECT id, role, is_active FROM users WHERE email = $1",
    [email.trim().toLowerCase()],
  );
  return rows[0] ?? null;
};

const removeStudent = async (classId, studentId) => {
  const { rows } = await pool.query(
    `DELETE FROM class_students
     WHERE class_id = $1 AND student_id = $2
     RETURNING class_id, student_id`,
    [classId, studentId],
  );
  return rows[0] ?? null;
};

export { listForTeacher, create, findAccessibleById, listStudents, addStudentByEmail, findUserByEmail, removeStudent };