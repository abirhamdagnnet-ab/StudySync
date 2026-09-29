import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("1h"),
  CORS_ORIGIN: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .custom((origin, helpers) => {
      if (new URL(origin).origin !== origin) {
        return helpers.error("string.uri");
      }
      return origin;
    })
    .default("http://localhost:5173"),
  INITIAL_ADMIN_EMAIL: Joi.string().trim().lowercase().email().optional(),
  INITIAL_ADMIN_PASSWORD: Joi.string().min(8).optional(),
  GEMINI_API_KEY: Joi.string().min(1).optional(),
  GEMINI_MODEL: Joi.string().default("gemini-2.5-flash"),
  AI_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(30000),
})
  .unknown(true)
  .with("INITIAL_ADMIN_EMAIL", "INITIAL_ADMIN_PASSWORD")
  .with("INITIAL_ADMIN_PASSWORD", "INITIAL_ADMIN_EMAIL");

const { error, value } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Invalid environment configuration: ${error.details.map((detail) => detail.message).join("; ")}`);
}

export default Object.freeze(value);
