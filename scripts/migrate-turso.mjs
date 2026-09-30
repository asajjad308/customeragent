// Applies prisma/migrations/*/migration.sql to the Turso database, once each.
// `prisma migrate deploy` can't talk to Turso directly, so the build runs this instead.
// Skips quietly when TURSO_DATABASE_URL isn't set (local builds use a SQLite file).
import { createClient } from '@libsql/client';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Values pasted into Vercel often keep quotes or a "Bearer " prefix, which Turso rejects with a 400
const clean = (v) => v?.trim().replace(/^["']+|["']+$/g, '').replace(/^Bearer\s+/i, '').trim() || undefined;

const url = clean(process.env.TURSO_DATABASE_URL);
if (!url) {
  console.log('[migrate-turso] TURSO_DATABASE_URL not set, skipping');
  process.exit(0);
}

const db = createClient({ url, authToken: clean(process.env.TURSO_AUTH_TOKEN) });
const dir = join(process.cwd(), 'prisma', 'migrations');

await db.execute(`CREATE TABLE IF NOT EXISTS "_app_migrations" (
  "name" TEXT NOT NULL PRIMARY KEY,
  "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

const applied = new Set((await db.execute('SELECT name FROM "_app_migrations"')).rows.map((r) => r.name));
const pending = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'migration.sql')) && !applied.has(d.name))
  .map((d) => d.name)
  .sort();

for (const name of pending) {
  const sql = readFileSync(join(dir, name, 'migration.sql'), 'utf8');
  // Migration and its bookkeeping row commit together, so a failure leaves nothing half-applied
  await db.executeMultiple(`BEGIN;\n${sql}\nINSERT INTO "_app_migrations" ("name") VALUES ('${name}');\nCOMMIT;`);
  console.log(`[migrate-turso] applied ${name}`);
}

console.log(`[migrate-turso] ${pending.length ? `${pending.length} applied` : 'up to date'}`);
