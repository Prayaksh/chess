import { Pool } from "pg";
import "dotenv/config";
const pool = new Pool({
  host: "localhost",
  database: process.env.DB_DB,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

export default pool;
