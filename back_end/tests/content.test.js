import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { sign } from "../src/utils/jwt.js";

const student = { id: "17", role: "student", is_active: true };
const teacher = { id: "22", role: "teacher", is_active: true };
const admin = { id: "1", role: "admin", is_active: true };

const tokenFor = (user) => sign({ sub: user.id });

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await pool.end();
});

describe("content permissions and question responses", () => {
  it("returns 401 when an admin route has no token", async () => {
    const response = await request(app).get("/api/admin/users");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("returns 403 when a logged-in student uses an admin route", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it("never selects or returns correct_answer for a student question read", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      expect(sql).not.toContain("correct_answer");
      return {
        rows: [{
          id: "5",
          topic_id: "3",
          prompt: "What is 2 + 2?",
          options: [3, 4, 5],
          difficulty: 1,
          explanation: "Two plus two equals four.",
          created_by: "22",
          is_active: true,
        }],
      };
    });

    const response = await request(app)
      .get("/api/questions/5")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(query).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(response.body.data.question).not.toHaveProperty("correct_answer");
  });

  it("does not return inactive questions to students", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      expect(sql).toContain("is_active = true");
      expect(sql).not.toContain("correct_answer");
      return { rows: [] };
    });

    const response = await request(app)
      .get("/api/questions/99")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(404);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("filters topic questions by difficulty and paginates results without answers for students", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      expect(sql).not.toContain("correct_answer");
      if (sql.includes("count(*)")) return { rows: [{ total: 9 }] };
      return { rows: [{ id: "10", prompt: "Question", options: [1, 2], difficulty: 3 }] };
    });

    const response = await request(app)
      .get("/api/topics/8/questions?difficulty=3&page=2&limit=5")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ page: 2, limit: 5, total: 9 });
    const questionListCall = query.mock.calls.find(([sql]) => sql.includes("FROM questions"));
    expect(questionListCall[1]).toEqual(["8", 3, 5, 5]);
  });

  it("rejects a question whose correct_answer is not in its options", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [teacher] });

    const response = await request(app)
      .post("/api/questions")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({
        topic_id: "3",
        prompt: "What is 2 + 2?",
        options: [3, 4, 5],
        correct_answer: 9,
        difficulty: 1,
        explanation: "Two plus two equals four.",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("correct_answer");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it("prevents a teacher from editing another teacher's question", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      return { rows: [{ id: "5", created_by: "23" }] };
    });

    const response = await request(app)
      .put("/api/questions/5")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({
        topic_id: "3",
        prompt: "Edited prompt",
        options: [1, 2],
        correct_answer: 1,
        difficulty: 2,
        explanation: "Explanation",
      });

    expect(response.status).toBe(403);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("allows ownership checks to find an inactive question without exposing it to reads", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("SELECT id, topic_id")) {
        expect(sql).not.toContain("is_active = true");
        return { rows: [{ id: "5", created_by: teacher.id }] };
      }
      return { rows: [{ id: "5", prompt: "Updated inactive question" }] };
    });

    const response = await request(app)
      .put("/api/questions/5")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({
        topic_id: "3",
        prompt: "Updated inactive question",
        options: [1, 2],
        correct_answer: 2,
        difficulty: 2,
        explanation: "Explanation",
      });

    expect(response.status).toBe(200);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("allows an admin to edit a question created by another user", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [admin] };
      if (sql.includes("UPDATE questions")) {
        return { rows: [{ id: "5", created_by: "23", prompt: "Edited prompt" }] };
      }
      throw new Error(`Unexpected query: ${sql}`);
    });

    const response = await request(app)
      .put("/api/questions/5")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({
        topic_id: "3",
        prompt: "Edited prompt",
        options: [1, 2],
        correct_answer: 1,
        difficulty: 2,
        explanation: "Explanation",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.question.prompt).toBe("Edited prompt");
    expect(query).toHaveBeenCalledTimes(2);
  });
});