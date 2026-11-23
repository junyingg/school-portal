import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { buildTestApp, type TestApp } from "./support/buildTestApp.ts"
import { getJson } from "./support/requests.ts"

let testApp: TestApp

beforeEach(async () => {
  testApp = await buildTestApp()
})

afterEach(async () => {
  await testApp.close()
})

describe("GET /healthz", () => {
  it("replies 200 while the process is up", async () => {
    const response = await getJson(testApp.app, "/healthz")

    expect(response.statusCode).toBe(200)
  })
})

describe("GET /readyz", () => {
  it("replies 200 when the database answers", async () => {
    const response = await getJson(testApp.app, "/readyz")

    expect(response.statusCode).toBe(200)
  })

  it("replies 503 once the server starts draining", async () => {
    testApp.readiness.markDraining()

    const response = await getJson(testApp.app, "/readyz")

    expect(response.statusCode).toBe(503)
    expect(response.json()).toStrictEqual({ error: "Service unavailable" })
  })
})
