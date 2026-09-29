import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import env from "./config/env.js";
import apiRoutes from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";
import notFound from "./middleware/notFound.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || origin === env.CORS_ORIGIN),
  credentials: false,
}));
app.use(express.json({ limit: "32kb" }));
app.use(morgan(env.NODE_ENV === "test" ? "tiny" : "dev"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    // Local React development deliberately repeats effects under StrictMode.
    // Keep the broad API limit for production while auth has its own limiter.
    limit: 1000,
    skip: () => env.NODE_ENV !== "production",
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use("/api", apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
