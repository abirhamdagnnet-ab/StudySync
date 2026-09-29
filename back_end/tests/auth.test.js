import { afterEach, describe, expect, it, jest } from "@jest/globals";
import bcrypt from "bcrypt";
import request from "supertest";
import app from "../src/app.js";
import pool from "../src/config/db.js";

const user = {
  id: "17",
  email: "student@example.com",
  role: "student",
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await pool.end();
});

describe("authentication routes", () => {
  it("registers a lowercase student account and never returns its password hash", async () => {
    const query = jest.spyOn(pool, "query").mockImplementation(async (sql, values) => {
      expect(sql).toContain("VALUES ($1, $2, 'student')");
      const passwordHash = values[1];
      expect(await bcrypt.compare("correct horse", passwordHash)).toBe(true);
      return { rows: [user] };
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "STUDENT@Example.com", password: "correct horse", role: "admin" });

    expect(response.status).toBe(201);
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      "student@example.com",
      expect.any(String),
    ]);
    expect(response.body.data.user).toEqual(user);
    expect(response.body.data.user).not.toHaveProperty("password_hash");
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it("logs in and returns a token without returning the stored password hash", async () => {
    const passwordHash = await bcrypt.hash("correct horse", 4);
    jest.spyOn(pool, "query").mockResolvedValue({
      rows: [{ ...user, password_hash: passwordHash }],
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "STUDENT@Example.com", password: "correct horse" });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(response.body.data.user).not.toHaveProperty("password_hash");
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it("uses the same error message for an unknown email and a wrong password", async () => {
    const unknownEmail = jest.spyOn(pool, "query").mockResolvedValueOnce({ rows: [] });
    const unknownResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "missing@example.com", password: "correct horse" });
    unknownEmail.mockRestore();

    const passwordHash = await bcrypt.hash("correct horse", 4);
    jest.spyOn(pool, "query").mockResolvedValue({
      rows: [{ ...user, password_hash: passwordHash }],
    });
    const wrongPasswordResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong password" });

    expect(unknownResponse.status).toBe(401);
    expect(wrongPasswordResponse.status).toBe(401);
    expect(unknownResponse.body.message).toBe(wrongPasswordResponse.body.message);
  });

  it("returns the current user from a valid bearer token", async () => {
    const passwordHash = await bcrypt.hash("correct horse", 4);
    jest.spyOn(pool, "query").mockResolvedValue({
      rows: [{ ...user, password_hash: passwordHash }],
    });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "correct horse" });

    jest.spyOn(pool, "query").mockResolvedValue({ rows: [user] });
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual(user);
    expect(response.body.data.user).not.toHaveProperty("password_hash");
  });

  it("rejects passwords shorter than eight characters", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "student@example.com", password: "short" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});