import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { sign } from "../src/utils/jwt.js";

const student = { id: "41", role: "student", is_active: true };
const teacher = { id: "22", role: "teacher", is_active: true };
const tokenFor = (user) => sign({ sub: user.id });
const session = {
  id: "81",
  student_id: student.id,
  topic_id: "3",
  status: "active",
  current_difficulty: 2,
  correct_streak: 0,
  wrong_streak: 0,
};

const mockClient = (queryImplementation) => {
  const client = {
    query: jest.fn(queryImplementation),
    release: jest.fn(),
  };
  jest.spyOn(pool, "connect").mockResolvedValue(client);
  return client;
};

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await pool.end();
});

describe("student quiz routes", () => {
  it("rejects requests without a token and rejects non-students", async () => {
    const anonymousResponse = await request(app).post("/api/quiz/sessions").send({ topic_id: "3" });
    expect(anonymousResponse.status).toBe(401);

    jest.spyOn(pool, "query").mockResolvedValue({ rows: [teacher] });
    const teacherResponse = await request(app)
      .post("/api/quiz/sessions")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({ topic_id: "3" });

    expect(teacherResponse.status).toBe(403);
  });

  it("starts a topic session at difficulty 2", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      if (sql.includes("FROM topics")) return { rows: [{ id: values[0] }] };
      expect(sql).toContain("current_difficulty");
      expect(sql).toContain("VALUES ($1, $2, 2)");
      expect(values).toEqual([student.id, 3]);
      return { rows: [{ ...session }] };
    });

    const response = await request(app)
      .post("/api/quiz/sessions")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ topic_id: "3" });

    expect(response.status).toBe(201);
    expect(response.body.data.session.current_difficulty).toBe(2);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("returns the nearest unanswered question without its correct answer", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      if (sql.includes("FROM quiz_sessions")) return { rows: [session] };
      expect(sql).not.toContain("correct_answer");
      expect(sql).toContain("ORDER BY abs(q.difficulty - $3)");
      return { rows: [{ id: "5", difficulty: 1, prompt: "Question", options: [1, 2] }] };
    });

    const response = await request(app)
      .get("/api/quiz/sessions/81/next-question")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.no_more_questions).toBe(false);
    expect(response.body.data.question).not.toHaveProperty("correct_answer");
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("returns a clear no-more-questions result when the topic is exhausted", async () => {
    jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      if (sql.includes("FROM quiz_sessions")) return { rows: [session] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/api/quiz/sessions/81/next-question")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      no_more_questions: true,
      message: "No more questions are available for this topic.",
      question: null,
    });
  });

  it("does not expose sessions belonging to another student", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      expect(sql).toContain("student_id = $2");
      expect(values).toEqual(["81", student.id]);
      return { rows: [] };
    });

    const response = await request(app)
      .get("/api/quiz/sessions/81/next-question")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(404);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("saves a valid answer and explanation in a committed transaction", async () => {
    const client = mockClient(async (sql) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return {};
      if (sql.includes("FROM quiz_sessions")) return { rows: [session] };
      if (sql.includes("FROM questions")) {
        return {
          rows: [{ id: "5", topic_id: "3", difficulty: 2, correct_answer: 2, explanation: "Two is correct." }],
        };
      }
      if (sql.includes("SELECT 1 FROM attempts")) return { rowCount: 0 };
      if (sql.includes("AS is_correct")) return { rows: [{ is_correct: true }] };
      if (sql.includes("INSERT INTO attempts")) {
        return { rows: [{ id: "91", is_correct: true, question_id: "5" }] };
      }
      if (sql.includes("UPDATE quiz_sessions")) {
        return { rows: [{ current_difficulty: 2, correct_streak: 1, wrong_streak: 0 }] };
      }
      if (sql.includes("INSERT INTO ability_scores")) {
        return { rows: [{ score: "54.00", questions_answered: 1 }] };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .post("/api/quiz/sessions/81/answer")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ question_id: "5", answer: 2 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      is_correct: true,
      explanation: "Two is correct.",
      current_difficulty: 2,
      correct_streak: 1,
      wrong_streak: 0,
      ability_score: 54,
    });
    expect(client.query.mock.calls.map(([sql]) => sql)).toContain("BEGIN");
    expect(client.query.mock.calls.map(([sql]) => sql)).toContain("COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("rolls back and rejects a second answer to the same question", async () => {
    const client = mockClient(async (sql) => {
      if (sql === "BEGIN" || sql === "ROLLBACK") return {};
      if (sql.includes("FROM quiz_sessions")) return { rows: [session] };
      if (sql.includes("FROM questions")) {
        return { rows: [{ id: "5", topic_id: "3", correct_answer: 2, explanation: "Explanation" }] };
      }
      if (sql.includes("SELECT 1 FROM attempts")) return { rowCount: 1 };
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .post("/api/quiz/sessions/81/answer")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ question_id: "5", answer: 2 });

    expect(response.status).toBe(409);
    expect(client.query.mock.calls.map(([sql]) => sql)).toContain("ROLLBACK");
    expect(client.query.mock.calls.some(([sql]) => sql.includes("INSERT INTO attempts"))).toBe(false);
  });

  it("rejects a question from outside the session topic", async () => {
    const client = mockClient(async (sql) => {
      if (sql === "BEGIN" || sql === "ROLLBACK") return {};
      if (sql.includes("FROM quiz_sessions")) return { rows: [session] };
      if (sql.includes("FROM questions")) return { rows: [] };
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .post("/api/quiz/sessions/81/answer")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ question_id: "5", answer: 2 });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Question not found in this session's topic");
    expect(client.query.mock.calls.map(([sql]) => sql)).toContain("ROLLBACK");
  });

  it("rejects answers after the session is finished", async () => {
    const finishedSession = { ...session, status: "finished" };
    const client = mockClient(async (sql) => {
      if (sql === "BEGIN" || sql === "ROLLBACK") return {};
      if (sql.includes("FROM quiz_sessions")) return { rows: [finishedSession] };
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .post("/api/quiz/sessions/81/answer")
      .set("Authorization", `Bearer ${tokenFor(student)}`)
      .send({ question_id: "5", answer: 2 });

    expect(response.status).toBe(409);
    expect(client.query.mock.calls.map(([sql]) => sql)).toContain("ROLLBACK");
  });

  it("finishes the session and returns its answer summary", async () => {
    const client = mockClient(async (sql) => {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return {};
      if (sql.includes("FROM quiz_sessions")) return { rows: [session] };
      if (sql.includes("UPDATE quiz_sessions")) {
        return { rows: [{ ...session, status: "finished" }] };
      }
      if (sql.includes("FROM attempts")) {
        return { rows: [{ total_questions: 4, correct_answers: 3, incorrect_answers: 1 }] };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .post("/api/quiz/sessions/81/finish")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.session.status).toBe("finished");
    expect(response.body.data.summary).toEqual({
      total_questions: 4,
      correct_answers: 3,
      incorrect_answers: 1,
    });
    expect(client.query.mock.calls.map(([sql]) => sql)).toContain("COMMIT");
  });
});