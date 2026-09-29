import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcrypt";
import env from "../src/config/env.js";
import pool from "../src/config/db.js";

const seedsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "seeds");

async function seed() {
  const files = fs.readdirSync(seedsDirectory).filter((file) => file.endsWith(".sql")).sort();

  for (const filename of files) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(fs.readFileSync(path.join(seedsDirectory, filename), "utf8"));
      await client.query("COMMIT");
      console.log(`Applied seed ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  await seedInitialAdmin();
}

async function seedInitialAdmin() {
  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;
    await client.query("LOCK TABLE users IN EXCLUSIVE MODE");

    const { rows: admins } = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (admins.length > 0) {
      await client.query("COMMIT");
      transactionOpen = false;
      console.log("An admin account already exists; initial admin seed skipped");
      return;
    }

    if (!env.INITIAL_ADMIN_EMAIL || !env.INITIAL_ADMIN_PASSWORD) {
      throw new Error("Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to create the first admin");
    }

    const email = env.INITIAL_ADMIN_EMAIL.trim().toLowerCase();
    const { rows: existingUsers } = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUsers.length > 0) {
      throw new Error("INITIAL_ADMIN_EMAIL belongs to an existing non-admin account");
    }

    const passwordHash = await bcrypt.hash(env.INITIAL_ADMIN_PASSWORD, 12);
    const { rows } = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       RETURNING id, email, role`,
      [email, passwordHash],
    );
    await client.query("COMMIT");
    transactionOpen = false;
    console.log(`Created initial admin account ${rows[0].email}`);
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

seed()
  .catch((error) => {
    console.error("Seeding failed", error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());