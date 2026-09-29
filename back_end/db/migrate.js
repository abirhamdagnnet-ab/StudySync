import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../src/config/db.js";

const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      executed_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = fs.readdirSync(migrationsDirectory).filter((file) => file.endsWith(".sql")).sort();

  for (const filename of files) {
    const { rowCount } = await pool.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [filename]);
    if (rowCount) continue;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(fs.readFileSync(path.join(migrationsDirectory, filename), "utf8"));
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      console.log(`Applied migration ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate()
  .catch((error) => {
    console.error("Migration failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());