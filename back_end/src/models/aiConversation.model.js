import pool from "../config/db.js";
import ApiError from "../utils/ApiError.js";

const create = async ({ studentId, attachmentId, topicId, title, question }) => {
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;

    if (attachmentId !== null && attachmentId !== undefined) {
      const { rows: attachments } = await client.query(
        "SELECT id FROM ai_attachments WHERE id = $1 AND student_id = $2 FOR SHARE",
        [attachmentId, studentId],
      );
      if (!attachments[0]) throw new ApiError(404, "Attached file not found");
    }

    const { rows: conversations } = await client.query(
      `INSERT INTO ai_conversations (student_id, attachment_id, topic_id, title)
       VALUES ($1, $2, $3, $4)
       RETURNING id, student_id, attachment_id, topic_id, title, created_at`,
      [studentId, attachmentId ?? null, topicId ?? null, title],
    );
    const conversation = conversations[0];

    let messages = [];
    if (question?.trim()) {
      const { rows } = await client.query(
        `INSERT INTO ai_messages (conversation_id, role, content)
         VALUES ($1, 'user', $2)
         RETURNING id, conversation_id, role, content, created_at`,
        [conversation.id, question.trim()],
      );
      messages = rows;
    }

    await client.query("COMMIT");
    transactionOpen = false;
    return { ...conversation, messages };
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    if (error.code === "23503") throw new ApiError(404, "Topic or attached file not found");
    throw error;
  } finally {
    client.release();
  }
};

const listForStudent = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT conversations.id, conversations.student_id, conversations.attachment_id,
       attachments.title AS attachment_title, conversations.topic_id,
       conversations.title, conversations.created_at
     FROM ai_conversations conversations
     LEFT JOIN ai_attachments attachments ON attachments.id = conversations.attachment_id
     WHERE conversations.student_id = $1
     ORDER BY conversations.created_at DESC, conversations.id DESC`,
    [studentId],
  );
  return rows;
};

const findForStudent = async (id, studentId) => {
  const { rows: conversations } = await pool.query(
    `SELECT conversations.id, conversations.student_id, conversations.attachment_id,
       attachments.title AS attachment_title, conversations.topic_id,
       conversations.title, conversations.created_at
     FROM ai_conversations conversations
     LEFT JOIN ai_attachments attachments ON attachments.id = conversations.attachment_id
     WHERE conversations.id = $1 AND conversations.student_id = $2`,
    [id, studentId],
  );
  if (!conversations[0]) return null;

  const { rows: messages } = await pool.query(
    `SELECT id, conversation_id, role, content, created_at
     FROM ai_messages
     WHERE conversation_id = $1
     ORDER BY created_at, id`,
    [id],
  );
  return { ...conversations[0], messages };
};

const deleteForStudent = async (id, studentId) => {
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const { rows: owned } = await client.query(
      "SELECT attachment_id FROM ai_conversations WHERE id = $1 AND student_id = $2 FOR UPDATE",
      [id, studentId],
    );
    if (!owned[0]) {
      await client.query("COMMIT");
      transactionOpen = false;
      return null;
    }

    await client.query("DELETE FROM ai_conversations WHERE id = $1 AND student_id = $2", [id, studentId]);
    let filePath = null;
    if (owned[0].attachment_id) {
      const { rows: attachments } = await client.query(
        `DELETE FROM ai_attachments
         WHERE id = $1 AND student_id = $2
           AND NOT EXISTS (
             SELECT 1 FROM ai_conversations WHERE attachment_id = $1
           )
         RETURNING file_path`,
        [owned[0].attachment_id, studentId],
      );
      filePath = attachments[0]?.file_path ?? null;
    }

    await client.query("COMMIT");
    transactionOpen = false;
    return { filePath };
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAnswerContext = async (conversationId, studentId) => {
  const { rows: conversations } = await pool.query(
    `SELECT conversations.id, conversations.student_id, conversations.attachment_id,
       conversations.topic_id, attachments.extracted_text AS attachment_text
     FROM ai_conversations conversations
     LEFT JOIN ai_attachments attachments
       ON attachments.id = conversations.attachment_id
       AND attachments.student_id = conversations.student_id
     WHERE conversations.id = $1 AND conversations.student_id = $2`,
    [conversationId, studentId],
  );
  if (!conversations[0]) return null;

  const { rows: messages } = await pool.query(
    `SELECT role, content FROM (
       SELECT id, role, content, created_at
       FROM ai_messages
       WHERE conversation_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 10
     ) recent_messages
     ORDER BY created_at ASC, id ASC`,
    [conversationId],
  );

  return { ...conversations[0], messages };
};

const saveAnswerMessages = async (conversationId, studentId, question, answer) => {
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;
    const { rows } = await client.query(
      `INSERT INTO ai_messages (conversation_id, role, content)
      SELECT id, message_values.role, message_values.content
       FROM ai_conversations
       CROSS JOIN (VALUES ('user'::text, $3::text), ('assistant'::text, $4::text))
         AS message_values(role, content)
       WHERE id = $1 AND student_id = $2
       RETURNING id, conversation_id, role, content, created_at`,
      [conversationId, studentId, question, answer],
    );
    if (rows.length !== 2) throw new ApiError(404, "AI conversation not found");

    await client.query("COMMIT");
    transactionOpen = false;
    return rows;
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export { create, listForStudent, findForStudent, deleteForStudent, getAnswerContext, saveAnswerMessages };
