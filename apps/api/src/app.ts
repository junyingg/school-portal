import { fastify, type FastifyInstance } from "fastify"

export interface HttpConfig {
  readonly logLevel: string
}

export interface AppDependencies {
  readonly config: HttpConfig
}

const REQUEST_ID_HEADER = "x-request-id"

export function buildApp(dependencies: AppDependencies): FastifyInstance {
  return fastify({
    logger: { level: dependencies.config.logLevel },
    requestIdHeader: REQUEST_ID_HEADER,
  })
}
