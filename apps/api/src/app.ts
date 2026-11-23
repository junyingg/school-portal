import { fastify, type FastifyInstance } from "fastify"
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import type { AppServices } from "./composition.ts"
import type { HttpConfig } from "./config/env.ts"
import { REQUEST_BODY_LIMIT_BYTES } from "./config/limits.ts"
import { errorHandlerPlugin } from "./errors/errorHandlerPlugin.ts"
import { healthPlugin } from "./http/healthPlugin.ts"
import { jsonOnlyPlugin } from "./http/jsonOnlyPlugin.ts"
import { securityPlugin } from "./http/securityPlugin.ts"
import { createClassHandlers } from "./modules/classes/classHandlers.ts"
import { createClassRoutes } from "./modules/classes/classRoutes.ts"
import { createTeacherHandlers } from "./modules/teachers/teacherHandlers.ts"
import { createTeacherRoutes } from "./modules/teachers/teacherRoutes.ts"

export interface AppDependencies {
  readonly config: HttpConfig
  readonly services: AppServices
  readonly checkReadiness: () => Promise<void>
}

const REQUEST_ID_HEADER = "x-request-id"

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const app = fastify({
    logger: { level: dependencies.config.logLevel },
    requestIdHeader: REQUEST_ID_HEADER,
    bodyLimit: REQUEST_BODY_LIMIT_BYTES,
    routerOptions: { ignoreTrailingSlash: true },
  })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(jsonOnlyPlugin)
  await app.register(errorHandlerPlugin)
  await app.register(securityPlugin, {
    corsAllowedOrigins: dependencies.config.corsAllowedOrigins,
  })
  await app.register(healthPlugin, { checkReadiness: dependencies.checkReadiness })
  await app.register(
    createTeacherRoutes(createTeacherHandlers(dependencies.services.teacherService)),
  )
  await app.register(createClassRoutes(createClassHandlers(dependencies.services.classService)))
  return app
}
