import type { Kysely } from "kysely"
import { Migrator, type MigrationProvider, type MigrationResult } from "kysely/migration"
import type { Database } from "./database.ts"
import { migrations } from "./migrations/index.ts"

const staticMigrationProvider: MigrationProvider = {
  getMigrations: () => Promise.resolve(migrations),
}

export function createMigrator(db: Kysely<Database>): Migrator {
  return new Migrator({ db, provider: staticMigrationProvider })
}

export async function migrateToLatest(db: Kysely<Database>): Promise<MigrationResult[]> {
  const { error, results } = await createMigrator(db).migrateToLatest()
  if (error !== undefined) {
    throw new Error("Database migration failed", { cause: error })
  }
  return results ?? []
}
