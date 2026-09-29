import { describe, expect, it } from "@jest/globals";
import express from "express";
import Joi from "joi";
import request from "supertest";
import errorHandler from "../src/middleware/errorHandler.js";
import notFound from "../src/middleware/notFound.js";
import validate from "../src/middleware/validate.js";
import ApiError from "../src/utils/ApiError.js";
import asyncHandler from "../src/utils/asyncHandler.js";
import { sign, verify } from "../src/utils/jwt.js";

const createApp = (registerRoutes) => {
  const app = express();
  app.use(express.json());
  registerRoutes(app);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

describe("API utilities and middleware", () => {
  it("returns the standard response for missing routes", async () => {
    const app = createApp(() => {});
    const response = await request(app).get("/missing");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, message: "Cannot GET /missing" });
  });

  it("validates and replaces query data with Joi's converted values", async () => {
    const app = createApp((router) => {
      router.get(
        "/items",
        validate(Joi.object({ page: Joi.number().integer().min(1).default(1) }), "query"),
        (request, response) => response.json(request.query),
      );
    });
    const response = await request(app).get("/items?page=2&unexpected=value");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ page: 2 });
  });

  it("validates and replaces route parameters with Joi's converted values", async () => {
    const app = createApp((router) => {
      router.get(
        "/topics/:topicId",
        validate(Joi.object({ topicId: Joi.number().integer().positive() }), "params"),
        (request, response) => response.json(request.params),
      );
    });
    const response = await request(app).get("/topics/42");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ topicId: 42 });
  });

  it("returns a 400 response when request validation fails", async () => {
    const app = createApp((router) => {
      router.post(
        "/users",
        validate(Joi.object({ email: Joi.string().email().required() })),
        (_request, response) => response.sendStatus(204),
      );
    });
    const response = await request(app).post("/users").send({ email: "invalid" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("email");
  });

  it("forwards rejected async handlers to the error middleware", async () => {
    const app = createApp((router) => {
      router.get("/failure", asyncHandler(async () => {
        throw new ApiError(418, "Request failed");
      }));
    });
    const response = await request(app).get("/failure");

    expect(response.status).toBe(418);
    expect(response.body).toMatchObject({ success: false, message: "Request failed" });
  });

  it("signs and verifies tokens with the configured secret", () => {
    const token = sign({ sub: "student-1" }, { expiresIn: "1m" });

    expect(verify(token).sub).toBe("student-1");
  });
});