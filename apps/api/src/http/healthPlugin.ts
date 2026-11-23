import type { FastifyPluginCallback } from "fastify"

const HEALTH_PATH = "/healthz"

export const healthPlugin: FastifyPluginCallback = (app, _options, done) => {
  app.get(HEALTH_PATH, () => ({ status: "ok" }))
  done()
}
