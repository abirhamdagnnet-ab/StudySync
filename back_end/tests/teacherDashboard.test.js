import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { sign } from "../src/utils/jwt.js";

const teacher = { id: "22", role: "teacher", is_active: true };
const otherRoleUser = { id: "1", role: "admin", is_active: true };
const tokenFor = (user) => sign({ sub: user.id });

afterEach(() => jest.restoreAllMocks());
afterAll(async () => pool.end());

describe("teacher dashboard stats", () => {
  it("returns only the authenticated teacher's class, question, and student totals", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      expect(sql).toContain("WHERE teacher_id = $1");
      expect(sql).toContain("WHERE created_by = $1");
      expect(values).toEqual([teacher.id]);
      return { rows: [{ my_classes: 2, my_questions: 14, students: 19 }] };
    });

    const response = await request(app)
      .get("/api/teacher/dashboard/stats")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.stats).toEqual({ my_classes: 2, my_questions: 14, students: 19 });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects non-teachers", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [otherRoleUser] });
    const response = await request(app)
      .get("/api/teacher/dashboard/stats")
      .set("Authorization", `Bearer ${tokenFor(otherRoleUser)}`);

    expect(response.status).toBe(403);
  });

  it("returns the class roster only after checking class ownership", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("FROM classes")) {
        expect(values).toEqual(["9", false, teacher.id]);
        return { rows: [{ id: "9", teacher_id: teacher.id }] };
      }
      expect(sql).toContain("FROM class_students");
      expect(values).toEqual(["9"]);
      return { rows: [{ id: "41", email: "student@example.com", is_active: true }] };
    });

    const response = await request(app)
      .get("/api/teacher/classes/9/students")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.students).toEqual([{ id: "41", email: "student@example.com", is_active: true }]);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("hides a class roster from a teacher who does not own that class", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/api/teacher/classes/9/students")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(404);
    expect(query).toHaveBeenCalledTimes(2);
  });
});