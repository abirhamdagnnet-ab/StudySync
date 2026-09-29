import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { sign } from "../src/utils/jwt.js";

const teacher = { id: "22", role: "teacher", is_active: true };
const otherTeacher = { id: "23", role: "teacher", is_active: true };
const studentUser = { id: "41", role: "student", is_active: true };
const admin = { id: "1", role: "admin", is_active: true };
const tokenFor = (user) => sign({ sub: user.id });

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await pool.end();
});

describe("teacher class routes", () => {
  it("rejects students from teacher class routes", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [studentUser] });

    const response = await request(app)
      .get("/api/teacher/classes")
      .set("Authorization", `Bearer ${tokenFor(studentUser)}`);

    expect(response.status).toBe(403);
  });

  it("lists only classes owned by the requesting teacher", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      expect(sql).toContain("teacher_id = $2");
      expect(values).toEqual([false, teacher.id]);
      return { rows: [{ id: "6", teacher_id: teacher.id, subject_id: "2", name: "Algebra A" }] };
    });

    const response = await request(app)
      .get("/api/teacher/classes")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.classes).toHaveLength(1);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("creates a class for a subject owned by the teacher", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      expect(sql).toContain("INSERT INTO classes");
      expect(values).toEqual(["Algebra A", "2", teacher.id]);
      return { rows: [{ id: "6", name: "Algebra A", subject_id: "2", teacher_id: teacher.id }] };
    });

    const response = await request(app)
      .post("/api/teacher/classes")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({ name: "Algebra A", subject_id: "2" });

    expect(response.status).toBe(201);
    expect(response.body.data.class.teacher_id).toBe(teacher.id);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("adds an active student by case-insensitive email", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("SELECT id, name, subject_id")) {
        return { rows: [{ id: "6", teacher_id: teacher.id }] };
      }
      expect(sql).toContain("users.role = 'student'");
      expect(values).toEqual(["6", "learner@example.com"]);
      return { rows: [{ class_id: "6", student_id: "41" }] };
    });

    const response = await request(app)
      .post("/api/teacher/classes/6/students")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({ email: "LEARNER@Example.com" });

    expect(response.status).toBe(201);
    expect(response.body.data.enrollment.student_id).toBe("41");
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("prevents duplicate enrollment", async () => {
    jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("SELECT id, name, subject_id")) {
        return { rows: [{ id: "6", teacher_id: teacher.id }] };
      }
      if (sql.includes("INSERT INTO class_students")) return { rows: [] };
      return { rows: [{ id: studentUser.id, role: "student", is_active: true }] };
    });

    const response = await request(app)
      .post("/api/teacher/classes/6/students")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({ email: "learner@example.com" });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Student is already enrolled in this class");
  });

  it("rejects an account whose role is not student", async () => {
    jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("SELECT id, name, subject_id")) {
        return { rows: [{ id: "6", teacher_id: teacher.id }] };
      }
      if (sql.includes("INSERT INTO class_students")) return { rows: [] };
      return { rows: [{ id: "33", role: "teacher", is_active: true }] };
    });

    const response = await request(app)
      .post("/api/teacher/classes/6/students")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({ email: "another-teacher@example.com" });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Active student not found");
  });

  it("hides another teacher's class when adding a student", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      return { rows: [] };
    });

    const response = await request(app)
      .post("/api/teacher/classes/6/students")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`)
      .send({ email: "learner@example.com" });

    expect(response.status).toBe(404);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("removes a student from a class owned by the teacher", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("SELECT id, name, subject_id")) {
        return { rows: [{ id: "6", teacher_id: teacher.id }] };
      }
      return { rows: [{ class_id: "6", student_id: studentUser.id }] };
    });

    const response = await request(app)
      .delete(`/api/teacher/classes/6/students/${studentUser.id}`)
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(204);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("allows admins to list all classes", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [admin] };
      expect(values).toEqual([true, admin.id]);
      return { rows: [{ id: "6", teacher_id: otherTeacher.id }, { id: "7", teacher_id: teacher.id }] };
    });

    const response = await request(app)
      .get("/api/teacher/classes")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.classes).toHaveLength(2);
    expect(query).toHaveBeenCalledTimes(2);
  });
});