import { METHOD_NOT_ALLOWED_MESSAGE } from "@school-portal/contract"
import type { FastifyInstance, HTTPMethods } from "fastify"

const HTTP_METHOD_NOT_ALLOWED = 405
const ROUTED_METHODS: readonly HTTPMethods[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]

function allowHeaderFor(allowedMethods: readonly HTTPMethods[]): string {
  const servesHead = allowedMethods.includes("GET")
  const methods = servesHead ? [...allowedMethods, "HEAD"] : [...allowedMethods]
  return methods.toSorted().join(", ")
}

export function registerMethodNotAllowed(
  app: FastifyInstance,
  url: string,
  allowedMethods: readonly HTTPMethods[],
): void {
  const allowHeader = allowHeaderFor(allowedMethods)
  const unsupportedMethods = ROUTED_METHODS.filter((method) => !allowedMethods.includes(method))
  app.route({
    method: unsupportedMethods,
    url,
    schema: { hide: true },
    handler: (_request, reply) =>
      reply
        .status(HTTP_METHOD_NOT_ALLOWED)
        .header("allow", allowHeader)
        .send({ error: METHOD_NOT_ALLOWED_MESSAGE }),
  })
}
