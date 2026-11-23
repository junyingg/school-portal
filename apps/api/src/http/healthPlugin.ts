import { SERVICE_UNAVAILABLE_MESSAGE } from "@school-portal/contract"
import type { FastifyPluginCallback } from "fastify"

export interface HealthOptions {
  readonly checkReadiness: () => Promise<void>
}

const LIVENESS_PATH = "/healthz"
const READINESS_PATH = "/readyz"
const HTTP_SERVICE_UNAVAILABLE = 503
const HEALTHY = { status: "ok" }
const HIDDEN_FROM_API_DOCUMENT = { hide: true }

export const healthPlugin: FastifyPluginCallback<HealthOptions> = (app, options, done) => {
  app.get(LIVENESS_PATH, { schema: HIDDEN_FROM_API_DOCUMENT }, () => HEALTHY)

  app.get(READINESS_PATH, { schema: HIDDEN_FROM_API_DOCUMENT }, async (request, reply) => {
    try {
      await options.checkReadiness()
    } catch (error) {
      request.log.warn({ err: error }, "Readiness check failed")
      return reply.status(HTTP_SERVICE_UNAVAILABLE).send({ error: SERVICE_UNAVAILABLE_MESSAGE })
    }
    return HEALTHY
  })

  done()
}
