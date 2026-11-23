import { NOT_FOUND_MESSAGE } from "@school-portal/contract"
import type { FastifyPluginCallback } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { mapErrorToReply } from "./errorMapper.ts"

const HTTP_NOT_FOUND = 404

const registerErrorHandlers: FastifyPluginCallback = (app, _options, done) => {
  app.setErrorHandler((error, request, reply) => {
    const errorReply = mapErrorToReply(error)
    if (errorReply.isServerFault) {
      request.log.error({ err: error }, "Request failed")
    }
    return reply.status(errorReply.statusCode).send({ error: errorReply.message })
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
