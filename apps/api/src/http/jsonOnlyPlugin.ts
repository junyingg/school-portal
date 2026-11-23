import type { FastifyPluginCallback } from "fastify"
import fastifyPlugin from "fastify-plugin"

const removeNonJsonParsers: FastifyPluginCallback = (app, _options, done) => {
  app.removeContentTypeParser("text/plain")
  done()
}

export const jsonOnlyPlugin = fastifyPlugin(removeNonJsonParsers, {
  name: "json-only",
  fastify: "5.x",
})
