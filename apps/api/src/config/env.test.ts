import { describe, expect, it } from "vitest"
import { loadConfig } from "./env.ts"

const DATABASE_URL = "postgres://school_portal_app:s3cret-password@localhost:5432/school_portal"

const MINIMAL_ENV = {
  NODE_ENV: "production",
  API_HOST: "0.0.0.0",
  API_PORT: "3000",
  LOG_LEVEL: "info",
  DATABASE_URL,
}

function configErrorMessage(env: Record<string, string>): string {
  try {
    loadConfig(env)
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
  throw new Error("expected loadConfig to throw")
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
    const { DATABASE_URL: _omitted, ...envWithoutDatabaseUrl } = MINIMAL_ENV

    expect(configErrorMessage(envWithoutDatabaseUrl)).toContain("DATABASE_URL")
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
