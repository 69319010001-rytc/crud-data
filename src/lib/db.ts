import { Pool } from "pg";

// Create a single shared PostgreSQL pool
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER || "rytc",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "rytc",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let cachedTableName: string | null = null;

/**
 * Resolves the exact table name in schema public matching student*
 * This handles "students ", "students", or "Student" automatically.
 */
export async function getStudentsTableName(): Promise<string> {
  if (cachedTableName) return cachedTableName;

  try {
    const res = await pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND LOWER(TRIM(table_name)) = 'students'
       LIMIT 1`
    );
    if (res.rows.length > 0) {
      cachedTableName = `"${res.rows[0].table_name}"`;
      return cachedTableName;
    }
  } catch (err) {
    console.error("Could not query information_schema for table name:", err);
  }

  // Fallback to "students " as seen in phpPgAdmin
  cachedTableName = '"students "';
  return cachedTableName;
}

export default pool;
