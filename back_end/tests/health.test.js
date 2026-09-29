import { afterAll, afterEach, describe, expect, it, jest } from "@jest/globals";
import request from "supertest";
import "./setup.js";
import app from "../src/app.js";
import pool from "../src/config/db.js";

afterAll(async () => {
  await pool.end();
});

describe("GET /api/health", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports a healthy API when the database responds", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [{ "?column?": 1 }] });

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
  });

  it("reports service unavailable when the database is down", async () => {
    jest.spyOn(pool, "query").mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ status: "error", database: "disconnected" });
  });

  it("sets CORS only for the configured frontend origin", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [{ "?column?": 1 }] });

    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");
    const denied = await request(app)
      .get("/api/health")
      .set("Origin", "https://untrusted.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    expect(allowed.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("rejects JSON request bodies above the configured limit", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "student@example.com", password: "x".repeat(40 * 1024) });

    expect(response.status).toBe(413);
  });
});