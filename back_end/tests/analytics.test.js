import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";
import { sign } from "../src/utils/jwt.js";
import { seededAttempts } from "./fixtures/analyticsAttempts.js";

const student = { id: "41", role: "student", is_active: true };
const teacher = { id: "22", role: "teacher", is_active: true };
const admin = { id: "1", role: "admin", is_active: true };
const tokenFor = (user) => sign({ sub: user.id });

const groupAttempts = (attempts, keyFunction) => attempts.reduce((groups, attempt) => {
  const key = keyFunction(attempt);
  groups[key] ??= [];
  groups[key].push(attempt);
  return groups;
}, {});

const accuracy = (attempts) => Number((100 * attempts.filter((attempt) => attempt.is_correct).length / attempts.length).toFixed(2));

const calculateSeededWeakTopics = (studentId) => Object.values(
  groupAttempts(
    seededAttempts.filter((attempt) => attempt.student_id === studentId),
    (attempt) => attempt.topic_id,
  ),
)
  .map((attempts) => {
    const recentAttempts = [...attempts]
      .sort((left, right) => right.answered_at - left.answered_at || right.id - left.id)
      .slice(0, 10);
    return {
      topic_id: recentAttempts[0].topic_id,
      topic_name: recentAttempts[0].topic_name,
      attempts_count: recentAttempts.length,
      accuracy: accuracy(recentAttempts),
    };
  })
  .filter((topic) => topic.attempts_count >= 3)
  .sort((left, right) => left.accuracy - right.accuracy || left.topic_name.localeCompare(right.topic_name));

const calculateSeededProgress = (studentId) => {
  const studentAttempts = seededAttempts.filter((attempt) => attempt.student_id === studentId);
  const topicAttempts = Object.values(groupAttempts(studentAttempts, (attempt) => attempt.topic_id));
  const abilityScores = { "1": 58, "2": 54, "3": 50 };
  const topics = topicAttempts.map((attempts) => ({
    topic_id: attempts[0].topic_id,
    topic_name: attempts[0].topic_name,
    ability_score: String(abilityScores[attempts[0].topic_id]),
    attempts_count: attempts.length,
    correct_count: attempts.filter((attempt) => attempt.is_correct).length,
    accuracy: accuracy(attempts).toFixed(2),
  }));
  const days = Object.values(groupAttempts(
    studentAttempts,
    (attempt) => attempt.answered_at.toISOString().slice(0, 10),
  )).map((attempts) => ({
    date: `${attempts[0].answered_at.toISOString().slice(0, 10)}T00:00:00.000Z`,
    attempts_count: attempts.length,
    correct_count: attempts.filter((attempt) => attempt.is_correct).length,
    accuracy: accuracy(attempts).toFixed(2),
  }));

  return { topics, accuracy_over_time: days };
};

const calculateClassTrends = () => {
  const classAttempts = seededAttempts.filter((attempt) => ["41", "42"].includes(attempt.student_id));
  const byTopic = groupAttempts(classAttempts, (attempt) => attempt.topic_id);
  return Object.values(byTopic)
    .filter((attempts) => attempts.length >= 3)
    .map((attempts) => {
      const byStudent = groupAttempts(attempts, (attempt) => attempt.student_id);
      const studentAccuracies = Object.values(byStudent).map(accuracy);
      return {
        topic_id: attempts[0].topic_id,
        topic_name: attempts[0].topic_name,
        attempts_count: attempts.length,
        students_count: studentAccuracies.length,
        average_accuracy: Number((studentAccuracies.reduce((sum, value) => sum + value, 0) / studentAccuracies.length).toFixed(2)),
      };
    })
    .sort((left, right) => left.average_accuracy - right.average_accuracy || left.topic_name.localeCompare(right.topic_name));
};

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await pool.end();
});

describe("student progress analytics", () => {
  it("ranks weak topics by accuracy over the latest ten seeded attempts and omits topics with fewer than three", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      expect(values).toEqual([student.id]);
      expect(sql).toContain("row_number() OVER");
      expect(sql).toContain("attempt_rank <= 10");
      expect(sql).toContain("HAVING count(*) >= 3");
      return { rows: calculateSeededWeakTopics(student.id) };
    });

    const response = await request(app)
      .get("/api/students/me/weak-topics")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.topics).toEqual([
      expect.objectContaining({ topic_name: "Fractions", attempts_count: 10, accuracy: 30 }),
      expect.objectContaining({ topic_name: "Algebra", attempts_count: 4, accuracy: 75 }),
    ]);
    expect(response.body.data.topics.some((topic) => topic.topic_name === "Geometry")).toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("returns ability, per-topic accuracy, and daily accuracy history from seeded attempts", async () => {
    const seededProgress = calculateSeededProgress(student.id);
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [student] };
      expect(values).toEqual([student.id]);
      if (sql.includes("date_trunc('day'")) return { rows: seededProgress.accuracy_over_time };
      return { rows: seededProgress.topics };
    });

    const response = await request(app)
      .get("/api/students/me/progress")
      .set("Authorization", `Bearer ${tokenFor(student)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.topics).toHaveLength(3);
    expect(response.body.data.topics[0]).toMatchObject({ topic_name: "Fractions", ability_score: "58", accuracy: "30.00" });
    expect(response.body.data.accuracy_over_time).toHaveLength(10);
    expect(response.body.data.accuracy_over_time[0]).toMatchObject({ attempts_count: 3, correct_count: 1 });
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("restricts student analytics endpoints to students", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [teacher] });
    const response = await request(app)
      .get("/api/students/me/progress")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(403);
  });
});

describe("class topic trends", () => {
  it("returns weakest-first average accuracy for a teacher's class using seeded attempts", async () => {
    const trends = calculateClassTrends();
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      if (sql.includes("FROM classes")) {
        expect(values).toEqual(["7", teacher.id, false]);
        return { rows: [{ id: "7" }] };
      }
      expect(sql).toContain("student_topic_accuracy");
      expect(sql).toContain("class_students.class_id = $1");
      return { rows: trends };
    });

    const response = await request(app)
      .get("/api/teacher/classes/7/trends")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(200);
    expect(response.body.data.topics).toEqual([
      expect.objectContaining({ topic_name: "Algebra", average_accuracy: 50 }),
      expect.objectContaining({ topic_name: "Fractions", average_accuracy: 65 }),
    ]);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("allows admins to read trends for any class", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [admin] };
      if (sql.includes("FROM classes")) {
        expect(values).toEqual(["7", admin.id, true]);
        return { rows: [{ id: "7" }] };
      }
      return { rows: [] };
    });

    const response = await request(app)
      .get("/api/teacher/classes/7/trends")
      .set("Authorization", `Bearer ${tokenFor(admin)}`);

    expect(response.status).toBe(200);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it("hides a class from a teacher who does not own it", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql) => {
      if (sql.includes("FROM users WHERE id = $1")) return { rows: [teacher] };
      return { rows: [] };
    });

    const response = await request(app)
      .get("/api/teacher/classes/7/trends")
      .set("Authorization", `Bearer ${tokenFor(teacher)}`);

    expect(response.status).toBe(404);
    expect(query).toHaveBeenCalledTimes(2);
  });
});