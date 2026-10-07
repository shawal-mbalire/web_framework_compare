/**
 * PostgreSQL client (postgres.js). Server-only: imported from server function handlers.
 */
import postgres from 'postgres';

export const sql = postgres(
  process.env.DATABASE_URL ?? 'postgresql://social_user:social_pass_2026@localhost:5432/social_audit',
  { max: 10, idle_timeout: 30, transform: postgres.camel }
);
