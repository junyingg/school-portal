import { METHOD_NOT_ALLOWED_MESSAGE } from "@school-portal/contract"
import type { FastifyInstance, HTTPMethods } from "fastify"

const HTTP_METHOD_NOT_ALLOWED = 405
const UNSUPPORTED_METHODS: HTTPMethods[] = ["PUT", "PATCH", "DELETE"]

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
  app.route({
    method: UNSUPPORTED_METHODS,
    url,
    schema: { hide: true },
    handler: (_request, reply) =>
      reply
        .status(HTTP_METHOD_NOT_ALLOWED)
        .header("allow", allowHeader)
        .send({ error: METHOD_NOT_ALLOWED_MESSAGE }),
  })
}
