import { fastify, type FastifyInstance } from "fastify"
import type { HttpConfig } from "./config/env.ts"
import { REQUEST_BODY_LIMIT_BYTES } from "./config/limits.ts"
import { errorHandlerPlugin } from "./errors/errorHandlerPlugin.ts"
import { healthPlugin } from "./http/healthPlugin.ts"
import { jsonOnlyPlugin } from "./http/jsonOnlyPlugin.ts"

export interface AppDependencies {
  readonly config: HttpConfig
}

const REQUEST_ID_HEADER = "x-request-id"

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = fastify({
    logger: { level: dependencies.config.logLevel },
    requestIdHeader: REQUEST_ID_HEADER,
    bodyLimit: REQUEST_BODY_LIMIT_BYTES,
  })
  await app.register(jsonOnlyPlugin)
  await app.register(errorHandlerPlugin)
  await app.register(healthPlugin)
  return app
}
