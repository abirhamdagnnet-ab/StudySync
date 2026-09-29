import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { sign } from "../src/utils/jwt.js";

const admin = { id: "1", role: "admin", is_active: true };
const student = { id: "41", role: "student", is_active: true };
const tokenFor = (user) => sign({ sub: user.id });

afterEach(() => jest.restoreAllMocks());
afterAll(async () => pool.end());

describe("GET /api/admin/dashboard/stats", () => {
  it("returns the dashboard aggregates to admins without sensitive user fields", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [admin] };
      if (sql.includes("FILTER (WHERE role")) return { rows: [{ total_users: 9, students: 6, teachers: 2, admins: 1 }] };
      if (sql.includes("total_questions")) return { rows: [{ total_questions: 24 }] };
      if (sql.includes("total_quiz_sessions")) return { rows: [{ total_quiz_sessions: 11 }] };
      if (sql.includes("FROM topics")) return { rows: [{ topic_id: "3", topic_name: "Algebra", question_count: 8 }] };
      if (sql.includes("ORDER BY created_at DESC")) return { rows: [{ id: "7", email: "recent@example.com", role: "student", is_active: true, created_at: "2026-09-28T00:00:00.000Z" }] };
      throw new Error(`Unexpected query: ${sql}`);
    });

    const response = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.stats).toMatchObject({
      total_users: 9,
      students: 6,
      teachers: 2,
      admins: 1,
      total_questions: 24,
      total_quiz_sessions: 11,
      questions_per_topic: [{ topic_name: "Algebra", question_count: 8 }],
      recent_users: [{ email: "recent@example.com", role: "student" }],
    });
    expect(JSON.stringify(response.body)).not.toContain("password_hash");
    expect(query).toHaveBeenCalledTimes(6);
  });

  it("rejects students", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [student] });

    const response = await request(app)
      .get("/api/admin/dashboard/stats")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(403);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});