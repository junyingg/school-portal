import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

export interface SecurityOptions {
  readonly corsAllowedOrigins: readonly string[]
}

const NOTHING = ["'none'"]

const registerSecurityHeaders: FastifyPluginAsync<SecurityOptions> = async (app, options) => {
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: NOTHING, frameAncestors: NOTHING },
    },
  })

  const hasAllowedOrigins = options.corsAllowedOrigins.length > 0
  if (hasAllowedOrigins) {
    await app.register(cors, { origin: [...options.corsAllowedOrigins] })
  }
}

export const securityPlugin = fastifyPlugin(registerSecurityHeaders, {
  name: "security",
  fastify: "5.x",
})
