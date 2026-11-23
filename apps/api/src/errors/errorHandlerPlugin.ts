import { INTERNAL_ERROR_MESSAGE, NOT_FOUND_MESSAGE } from "@school-portal/contract"
import type { FastifyPluginCallback } from "fastify"
import fastifyPlugin from "fastify-plugin"

const HTTP_NOT_FOUND = 404
const HTTP_INTERNAL_SERVER_ERROR = 500

const registerErrorHandlers: FastifyPluginCallback = (app, _options, done) => {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Request failed")
    return reply.status(HTTP_INTERNAL_SERVER_ERROR).send({ error: INTERNAL_ERROR_MESSAGE })
  })
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(HTTP_NOT_FOUND).send({ error: NOT_FOUND_MESSAGE })
  })
  done()
}

export const errorHandlerPlugin = fastifyPlugin(registerErrorHandlers, {
  name: "error-handler",
  fastify: "5.x",
})
