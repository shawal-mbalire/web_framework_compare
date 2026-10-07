/**
 * PostgreSQL client (postgres.js) shared by actions, API routes and pages.
 * The schema lives in ../schema.sql.
 */
import postgres from 'postgres';

const url =
  process.env.DATABASE_URL ??
  import.meta.env.DATABASE_URL ??
  'postgresql://social_user:social_pass_2026@localhost:5432/social_audit';

export const sql = postgres(url, {
  max: 10,
  idle_timeout: 30,
  transform: postgres.camel,
});
