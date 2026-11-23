import { describe, expect, it } from "vitest"
import { loadConfig, loadMigrationConfig } from "./env.ts"

const DATABASE_URL = "postgres://school_portal_app:s3cret-password@localhost:5432/school_portal"

const ENV_WITHOUT_DATABASE_URL = {
  NODE_ENV: "production",
  API_HOST: "0.0.0.0",
  API_PORT: "3000",
  LOG_LEVEL: "info",
}

const MINIMAL_ENV = { ...ENV_WITHOUT_DATABASE_URL, DATABASE_URL }

function thrownMessage(action: () => unknown): string {
  try {
    action()
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
  throw new Error("expected the action to throw")
}

function configErrorMessage(env: Record<string, string>): string {
  return thrownMessage(() => loadConfig(env))
}

describe("loadConfig", () => {
  it("reads the required keys and defaults the optional ones", () => {
    expect(loadConfig(MINIMAL_ENV)).toStrictEqual({
      nodeEnv: "production",
      host: "0.0.0.0",
      port: 3000,
      logLevel: "info",
      databaseUrl: DATABASE_URL,
      dbPoolMax: 10,
      corsAllowedOrigins: [],
    })
  })

  it("reads DB_POOL_MAX when set", () => {
    expect(loadConfig({ ...MINIMAL_ENV, DB_POOL_MAX: "25" }).dbPoolMax).toBe(25)
  })

  it.each([
    ["API_PORT", "0"],
    ["API_PORT", "65536"],
    ["API_PORT", "abc"],
    ["NODE_ENV", "staging"],
    ["LOG_LEVEL", "loud"],
    ["DB_POOL_MAX", "0"],
  ])("rejects %s=%s and names the key", (key, value) => {
    expect(configErrorMessage({ ...MINIMAL_ENV, [key]: value })).toContain(key)
  })

  it("names every invalid key in one error", () => {
    const message = configErrorMessage({ ...MINIMAL_ENV, API_PORT: "abc", LOG_LEVEL: "loud" })

    expect(message).toContain("API_PORT")
    expect(message).toContain("LOG_LEVEL")
  })

  it("names a missing DATABASE_URL", () => {
    expect(configErrorMessage(ENV_WITHOUT_DATABASE_URL)).toContain("DATABASE_URL")
  })

  it("names a non-URL DATABASE_URL without echoing its value", () => {
    const message = configErrorMessage({ ...MINIMAL_ENV, DATABASE_URL: "not a url" })

    expect(message).toContain("DATABASE_URL")
    expect(message).not.toContain("not a url")
  })

  it("never echoes the database password when another key is invalid", () => {
    expect(configErrorMessage({ ...MINIMAL_ENV, API_PORT: "abc" })).not.toContain("s3cret")
  })

  it.each([
    ["", []],
    ["http://a.example, http://b.example", ["http://a.example", "http://b.example"]],
  ])("splits CORS_ALLOWED_ORIGINS %j into trimmed entries", (value, expected) => {
    expect(loadConfig({ ...MINIMAL_ENV, CORS_ALLOWED_ORIGINS: value }).corsAllowedOrigins).toEqual(
      expected,
    )
  })
})

describe("loadMigrationConfig", () => {
  const MIGRATION_DATABASE_URL =
    "postgres://school_portal_migrator:m1grator-secret@localhost:5432/school_portal"

  it("reads MIGRATION_DATABASE_URL", () => {
    expect(loadMigrationConfig({ MIGRATION_DATABASE_URL })).toStrictEqual({
      migrationDatabaseUrl: MIGRATION_DATABASE_URL,
    })
  })

  it("names a missing MIGRATION_DATABASE_URL", () => {
    expect(thrownMessage(() => loadMigrationConfig({}))).toContain("MIGRATION_DATABASE_URL")
  })

  it("names a non-URL MIGRATION_DATABASE_URL without echoing its value", () => {
    const message = thrownMessage(() =>
      loadMigrationConfig({ MIGRATION_DATABASE_URL: "m1grator-secret" }),
    )

    expect(message).toContain("MIGRATION_DATABASE_URL")
    expect(message).not.toContain("m1grator-secret")
  })
})
