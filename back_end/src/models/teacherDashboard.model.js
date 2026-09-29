import pool from "../config/db.js";

const getStats = async (teacherId) => {
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*)::integer FROM classes WHERE teacher_id = $1) AS my_classes,
       (SELECT count(*)::integer FROM questions WHERE created_by = $1) AS my_questions,
       (SELECT count(DISTINCT class_students.student_id)::integer
        FROM class_students
        JOIN classes ON classes.id = class_students.class_id
        WHERE classes.teacher_id = $1) AS students`,
    [teacherId],
  );
  return rows[0];
};

export { getStats };