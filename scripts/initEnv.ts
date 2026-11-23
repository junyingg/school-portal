import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const REPOSITORY_ROOT = new URL("..", import.meta.url)
const EXAMPLE_PATH = fileURLToPath(new URL(".env.example", REPOSITORY_ROOT))
const ENV_PATH = fileURLToPath(new URL(".env", REPOSITORY_ROOT))
const OWNER_READ_WRITE_ONLY = 0o600
const PASSWORD_BYTES = 24
const LOCAL_DATABASE_ADDRESS = "localhost:5432"
const DATABASE_NAME = "school_portal"
const APP_ROLE = "school_portal_app"
const MIGRATOR_ROLE = "school_portal_migrator"

function randomPassword(): string {
  return randomBytes(PASSWORD_BYTES).toString("hex")
}

function localDatabaseUrl(role: string, password: string): string {
  return `postgres://${role}:${password}@${LOCAL_DATABASE_ADDRESS}/${DATABASE_NAME}`
}

function withValues(template: string, values: ReadonlyMap<string, string>): string {
  return template
    .split("\n")
    .map((line) => {
      const separatorIndex = line.indexOf("=")
      if (separatorIndex === -1) {
        return line
      }
      const key = line.slice(0, separatorIndex)
      const value = values.get(key)
      return value === undefined ? line : `${key}=${value}`
    })
    .join("\n")
}

function generatedValues(): ReadonlyMap<string, string> {
  const appPassword = randomPassword()
  const migratorPassword = randomPassword()
  return new Map([
    ["POSTGRES_PASSWORD", randomPassword()],
    ["APP_DB_PASSWORD", appPassword],
    ["MIGRATOR_DB_PASSWORD", migratorPassword],
    ["DATABASE_URL", localDatabaseUrl(APP_ROLE, appPassword)],
    ["MIGRATION_DATABASE_URL", localDatabaseUrl(MIGRATOR_ROLE, migratorPassword)],
  ])
}

if (existsSync(ENV_PATH)) {
  console.error(".env already exists. Delete it first if you want new passwords.")
  process.exitCode = 1
} else {
  const template = readFileSync(EXAMPLE_PATH, "utf8")
  writeFileSync(ENV_PATH, withValues(template, generatedValues()), { mode: OWNER_READ_WRITE_ONLY })
  console.log("Wrote .env with generated database passwords.")
}
