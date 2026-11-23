import { z } from "zod"

const MIN_PORT = 1
const MAX_PORT = 65_535
const MIN_DB_POOL_SIZE = 1
const DEFAULT_DB_POOL_MAX = 10
const POSTGRES_PROTOCOL = /^postgres(ql)?$/

const NODE_ENVIRONMENTS = ["development", "production", "test"] as const
const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number]
export type LogLevel = (typeof LOG_LEVELS)[number]

export interface AppConfig {
  readonly nodeEnv: NodeEnvironment
  readonly host: string
  readonly port: number
  readonly logLevel: LogLevel
  readonly databaseUrl: string
  readonly dbPoolMax: number
  readonly corsAllowedOrigins: readonly string[]
}

export type HttpConfig = Pick<AppConfig, "logLevel">

function splitCommaSeparatedList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "")
}

const environmentSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS),
  API_HOST: z.string().min(1),
  API_PORT: z.coerce.number().int().min(MIN_PORT).max(MAX_PORT),
  LOG_LEVEL: z.enum(LOG_LEVELS),
  DATABASE_URL: z.url({ protocol: POSTGRES_PROTOCOL }),
  DB_POOL_MAX: z.coerce.number().int().min(MIN_DB_POOL_SIZE).default(DEFAULT_DB_POOL_MAX),
  CORS_ALLOWED_ORIGINS: z.string().default("").transform(splitCommaSeparatedList),
})

function describeIssue(issue: z.core.$ZodIssue): string {
  const key = issue.path.map(String).join(".")
  return `${key}: ${issue.message}`
}

export function loadConfig(env: Readonly<Record<string, string | undefined>>): AppConfig {
  const result = environmentSchema.safeParse(env)
  if (!result.success) {
    const problems = result.error.issues.map(describeIssue).join("; ")
    throw new Error(`Invalid environment: ${problems}`)
  }

  const parsed = result.data
  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.API_HOST,
    port: parsed.API_PORT,
    logLevel: parsed.LOG_LEVEL,
    databaseUrl: parsed.DATABASE_URL,
    dbPoolMax: parsed.DB_POOL_MAX,
    corsAllowedOrigins: parsed.CORS_ALLOWED_ORIGINS,
  }
}
