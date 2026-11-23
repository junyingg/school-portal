import { sql } from "kysely"
import { inject } from "vitest"
import { createDatabase } from "../../../src/db/database.ts"

export async function resetDatabase(): Promise<void> {
  const db = createDatabase({ connectionString: inject("migratorDatabaseUrl"), maxConnections: 1 })
  try {
    await sql`truncate classes, teachers restart identity cascade`.execute(db)
  } finally {
    await db.destroy()
  }
}
