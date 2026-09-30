// Applies prisma/migrations/*/migration.sql to the Turso database, once each.
// `prisma migrate deploy` can't talk to Turso directly, so the build runs this instead.
// Skips quietly when TURSO_DATABASE_URL isn't set (local builds use a SQLite file).
import 'dotenv/config';
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

const authToken = clean(process.env.TURSO_AUTH_TOKEN);
const db = createClient({ url, authToken });
const dir = join(process.cwd(), 'prisma', 'migrations');

// libSQL drops Turso's error text; on failure, ask again directly and print why, without the secret
async function explainConnectionError() {
  const t = authToken ?? '';
  const parts = t.split('.');
  let claims = 'not a JWT';
  try {
    const c = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    claims = JSON.stringify({ a: c.a, id: c.id, p: c.p ? Object.keys(c.p) : undefined, exp: c.exp ? new Date(c.exp * 1000).toISOString() : 'none' });
  } catch {}
  console.error(`[migrate-turso] url host: ${new URL(url.replace(/^libsql:/, 'https:')).host}`);
  console.error(`[migrate-turso] token: ${t.length} chars, ${parts.length} parts, whitespace inside: ${/\s/.test(t)}, non-ASCII: ${/[^\x21-\x7e]/.test(t)}, claims: ${claims}`);
  try {
    const res = await fetch(`${url.replace(/^libsql:/, 'https:')}/v2/pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t && { Authorization: `Bearer ${t}` }) },
      body: JSON.stringify({ requests: [{ type: 'execute', stmt: { sql: 'SELECT 1' } }, { type: 'close' }] }),
    });
    console.error(`[migrate-turso] direct request: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  } catch (e) {
    console.error(`[migrate-turso] direct request failed: ${e.message}`);
  }
}

try {
  await db.execute(`CREATE TABLE IF NOT EXISTS "_app_migrations" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
} catch (e) {
  await explainConnectionError();
  throw e;
}

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
