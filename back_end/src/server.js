import app from "./app.js";
import env from "./config/env.js";
import pool from "./config/db.js";

const server = app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));