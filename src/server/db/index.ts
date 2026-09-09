import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let database: ReturnType<typeof createDatabase> | null = null;

function createDatabase(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
}

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for database operations');
  }

  database ??= createDatabase(databaseUrl);
  return database;
}

export { schema };
