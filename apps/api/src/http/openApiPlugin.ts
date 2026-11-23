import swagger from "@fastify/swagger"
import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { jsonSchemaTransform } from "fastify-type-provider-zod"

const OPENAPI_VERSION = "3.1.0"
const API_VERSION = "1.0.0"

const registerOpenApi: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      openapi: OPENAPI_VERSION,
      info: {
        title: "School Portal API",
        version: API_VERSION,
        description: "Register teachers and add classes, each with one form teacher.",
      },
    },
    transform: jsonSchemaTransform,
  })
}

export const openApiPlugin = fastifyPlugin(registerOpenApi, {
  name: "openapi",
  fastify: "5.x",
})
