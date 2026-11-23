import { randomBytes } from "node:crypto"
import { fileURLToPath } from "node:url"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import type { TestProject } from "vitest/node"
import { createDatabase } from "../../src/db/database.ts"
import { migrateToLatest } from "../../src/db/migrator.ts"

declare module "vitest" {
  export interface ProvidedContext {
    appDatabaseUrl: string
    migratorDatabaseUrl: string
  }
}

const POSTGRES_IMAGE = "postgres:18-alpine"
const POSTGRES_PORT = 5432
const DATABASE_NAME = "school_portal"
const APP_ROLE = "school_portal_app"
const MIGRATOR_ROLE = "school_portal_migrator"
const PASSWORD_BYTES = 16
const EXECUTABLE_FILE_MODE = 0o755
const ROLES_SCRIPT_TARGET = "/docker-entrypoint-initdb.d/01-create-roles.sh"
const ROLES_SCRIPT_SOURCE = fileURLToPath(
  new URL("../../../../docker/postgres/initdb/01-create-roles.sh", import.meta.url),
)

function randomPassword(): string {
  return randomBytes(PASSWORD_BYTES).toString("hex")
}

function databaseUrl(role: string, password: string, host: string, port: number): string {
  return `postgres://${role}:${password}@${host}:${port}/${DATABASE_NAME}`
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const appPassword = randomPassword()
  const migratorPassword = randomPassword()

  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase(DATABASE_NAME)
    .withCopyFilesToContainer([
      { source: ROLES_SCRIPT_SOURCE, target: ROLES_SCRIPT_TARGET, mode: EXECUTABLE_FILE_MODE },
    ])
    .withEnvironment({ APP_DB_PASSWORD: appPassword, MIGRATOR_DB_PASSWORD: migratorPassword })
    .start()

  const host = container.getHost()
  const port = container.getMappedPort(POSTGRES_PORT)
  const migratorDatabaseUrl = databaseUrl(MIGRATOR_ROLE, migratorPassword, host, port)

  const migratorDb = createDatabase({ connectionString: migratorDatabaseUrl, maxConnections: 1 })
  try {
    await migrateToLatest(migratorDb)
  } finally {
    await migratorDb.destroy()
  }

  project.provide("appDatabaseUrl", databaseUrl(APP_ROLE, appPassword, host, port))
  project.provide("migratorDatabaseUrl", migratorDatabaseUrl)

  return async () => {
    await container.stop()
  }
}
