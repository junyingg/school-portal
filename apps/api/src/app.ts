import { fastify, type FastifyInstance } from "fastify"
import { errorHandlerPlugin } from "./errors/errorHandlerPlugin.ts"
import { healthPlugin } from "./http/healthPlugin.ts"

export interface HttpConfig {
  readonly logLevel: string
}

export interface AppDependencies {
  readonly config: HttpConfig
}

const REQUEST_ID_HEADER = "x-request-id"

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = fastify({
    logger: { level: dependencies.config.logLevel },
    requestIdHeader: REQUEST_ID_HEADER,
  })
  await app.register(errorHandlerPlugin)
  await app.register(healthPlugin)
  return app
}
