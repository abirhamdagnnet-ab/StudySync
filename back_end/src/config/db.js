import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error", error);
});

export default pool;