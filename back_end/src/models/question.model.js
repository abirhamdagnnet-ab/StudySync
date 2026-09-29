import pool from "../config/db.js";

const columns = (includeAnswer) => [
  "id",
  "topic_id",
  "prompt",
  "options",
  ...(includeAnswer ? ["correct_answer"] : []),
  "difficulty",
  "explanation",
  "created_by",
  "is_active",
  "created_at",
  "updated_at",
].join(", ");

const list = async ({ topicId = null, difficulty = null, page, limit, includeAnswer }) => {
  const offset = (page - 1) * limit;
  const values = [topicId, difficulty, limit, offset];
  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT ${columns(includeAnswer)} FROM questions
       WHERE is_active = true
         AND ($1::bigint IS NULL OR topic_id = $1)
         AND ($2::smallint IS NULL OR difficulty = $2)
       ORDER BY id
       LIMIT $3 OFFSET $4`,
      values,
    ),
    pool.query(
      `SELECT count(*)::integer AS total FROM questions
       WHERE is_active = true
         AND ($1::bigint IS NULL OR topic_id = $1)
         AND ($2::smallint IS NULL OR difficulty = $2)`,
      [topicId, difficulty],
    ),
  ]);

  return { items: itemsResult.rows, total: countResult.rows[0].total, page, limit };
};

const findById = async (id, includeAnswer = true, includeInactive = false) => {
  const activeClause = includeInactive ? "" : " AND is_active = true";
  const { rows } = await pool.query(
    `SELECT ${columns(includeAnswer)} FROM questions WHERE id = $1${activeClause}`,
    [id],
  );
  return rows[0] ?? null;
};

const create = async ({ topic_id: topicId, prompt, options, correct_answer: correctAnswer, difficulty, explanation, created_by: createdBy }) => {
  const { rows } = await pool.query(
    `INSERT INTO questions (topic_id, prompt, options, correct_answer, difficulty, explanation, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${columns(true)}`,
    [topicId, prompt, options, correctAnswer, difficulty, explanation, createdBy],
  );
  return rows[0];
};

const update = async (id, { topic_id: topicId, prompt, options, correct_answer: correctAnswer, difficulty, explanation }) => {
  const { rows } = await pool.query(
    `UPDATE questions
     SET topic_id = $2, prompt = $3, options = $4, correct_answer = $5,
         difficulty = $6, explanation = $7, updated_at = now()
     WHERE id = $1
     RETURNING ${columns(true)}`,
    [id, topicId, prompt, options, correctAnswer, difficulty, explanation],
  );
  return rows[0] ?? null;
};

const remove = async (id) => {
  const { rows } = await pool.query(`DELETE FROM questions WHERE id = $1 RETURNING id`, [id]);
  return rows[0] ?? null;
};

export { list, findById, create, update, remove };