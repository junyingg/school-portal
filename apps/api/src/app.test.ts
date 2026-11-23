import type { FastifyInstance, FastifyPluginCallback } from "fastify"
import { describe, expect, it, onTestFinished } from "vitest"
import { buildApp, type AppDependencies } from "./app.ts"

const TEST_DEPENDENCIES: AppDependencies = {
  config: { logLevel: "silent" },
}

const LEAKY_ERROR_MESSAGE = "select * from teachers where password = 'hunter2'"

async function startApp(): Promise<FastifyInstance> {
  const app = await buildApp(TEST_DEPENDENCIES)
  onTestFinished(() => app.close())
  return app
}

const routeThatThrows: FastifyPluginCallback = (plugin, _options, done) => {
  plugin.get("/explode", () => {
    throw new Error(LEAKY_ERROR_MESSAGE)
  })
  done()
}

const SIXTEEN_KIB = 16 * 1024

const echoRoute: FastifyPluginCallback = (plugin, _options, done) => {
  plugin.post("/probe", (request, reply) => reply.status(201).send(request.body))
  done()
}

async function startAppWithEchoRoute(): Promise<FastifyInstance> {
  const app = await startApp()
  await app.register(echoRoute)
  return app
}

describe("unknown route", () => {
  it("replies 404 with a JSON error body", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "GET", url: "/nope" })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toStrictEqual({ error: "Not found" })
  })
})

describe("GET /healthz", () => {
  it("replies 200 while the process is up", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "GET", url: "/healthz" })

    expect(response.statusCode).toBe(200)
  })
})

describe("error handler", () => {
  it("reaches a route in a separate plugin and hides the error detail", async () => {
    const app = await startApp()
    await app.register(routeThatThrows)

    const response = await app.inject({ method: "GET", url: "/explode" })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toStrictEqual({ error: "Internal server error" })
  })
})

describe("POST body handling", () => {
  it("rejects a text/plain body with 415", async () => {
    const app = await startAppWithEchoRoute()

    const response = await app.inject({
      method: "POST",
      url: "/probe",
      headers: { "content-type": "text/plain" },
      payload: "hello",
    })

    expect(response.statusCode).toBe(415)
    expect(response.json()).toStrictEqual({ error: "Content-Type must be application/json" })
  })

  it("rejects a body over 16 KiB with 413", async () => {
    const app = await startAppWithEchoRoute()

    const response = await app.inject({
      method: "POST",
      url: "/probe",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify("x".repeat(SIXTEEN_KIB)),
    })

    expect(response.statusCode).toBe(413)
    expect(response.json()).toStrictEqual({ error: "Request body too large" })
  })

  it("rejects malformed JSON with 400", async () => {
    const app = await startAppWithEchoRoute()

    const response = await app.inject({
      method: "POST",
      url: "/probe",
      headers: { "content-type": "application/json" },
      payload: '{"name":',
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: "Request body must be valid JSON" })
  })
})
