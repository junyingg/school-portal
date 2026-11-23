import { loadMigrationConfig } from "../config/env.ts"
import { createDatabase } from "./database.ts"
import { migrateToLatest } from "./migrator.ts"

const MIGRATION_CONNECTIONS = 1

const config = loadMigrationConfig(process.env)
const db = createDatabase({
  connectionString: config.migrationDatabaseUrl,
  maxConnections: MIGRATION_CONNECTIONS,
})

try {
  const results = await migrateToLatest(db)
  if (results.length === 0) {
    console.log("Database schema is already up to date")
  }
  for (const result of results) {
    console.log(`${result.migrationName}: ${result.status}`)
  }
} finally {
  await db.destroy()
}
