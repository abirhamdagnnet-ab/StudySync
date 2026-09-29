import pool from "../config/db.js";

const checkDatabase = () => pool.query("SELECT 1");

export { checkDatabase };