import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseURL =
  process.env.E2E_DATABASE_URL ??
  "postgres://ultra:ultra@127.0.0.1:5433/ultra_e2e";

async function withDatabase(
  callback: (sql: ReturnType<typeof postgres>) => Promise<void>,
) {
  const sql = postgres(databaseURL, { max: 1 });

  try {
    await callback(sql);
  } finally {
    await sql.end();
  }
}

export async function migrateDatabase() {
  await withDatabase(async (sql) => {
    await migrate(drizzle(sql), {
      migrationsFolder: resolve(process.cwd(), "drizzle"),
    });
  });
}

export async function resetDatabase() {
  await withDatabase(async (sql) => {
    await sql.unsafe(
      'TRUNCATE TABLE "accounts", "projects", "sessions", "users", "verification_tokens" CASCADE',
    );
  });
}
