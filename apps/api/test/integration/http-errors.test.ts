import { SPEC_TEACHERS } from "@school-portal/contract"
import type { LightMyRequestResponse } from "fastify"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { buildTestApp, type TestApp } from "./support/buildTestApp.ts"
import {
  CLASSES_PATH,
  JSON_CONTENT_TYPE,
  TEACHERS_PATH,
  getJson,
  postRaw,
} from "./support/requests.ts"
import { resetDatabase } from "./support/resetDatabase.ts"

const [MARY] = SPEC_TEACHERS
const POST_PATHS = [TEACHERS_PATH, CLASSES_PATH]
const SIXTEEN_KIB = 16 * 1024
const EMPTY_NAME_OBJECT_LENGTH = '{"name":""}'.length

function jsonBodyOfLength(length: number): string {
  return JSON.stringify({ name: "x".repeat(length - EMPTY_NAME_OBJECT_LENGTH) })
}

function expectJsonError(
  response: LightMyRequestResponse,
  statusCode: number,
  error: string,
): void {
  expect(response.statusCode).toBe(statusCode)
  expect(response.headers["content-type"]).toBe(JSON_CONTENT_TYPE)
  expect(response.json()).toStrictEqual({ error })
}

let testApp: TestApp

beforeAll(async () => {
  testApp = await buildTestApp()
})

afterAll(async () => {
  await testApp.close()
})

beforeEach(async () => {
  await resetDatabase()
})

describe.each(POST_PATHS)("POST %s", (path) => {
  it("rejects malformed JSON with 400", async () => {
    const response = await postRaw(testApp.app, path, '{"name":', "application/json")

    expectJsonError(response, 400, "Request body must be valid JSON")
  })

  it.each(["[]", '"x"', "42", "null"])("rejects the non-object body %s with 400", async (body) => {
    const response = await postRaw(testApp.app, path, body, "application/json")

    expectJsonError(response, 400, "Request body must be a JSON object")
  })

  it("rejects an empty JSON body with 400", async () => {
    const response = await postRaw(testApp.app, path, "", "application/json")

    expectJsonError(response, 400, "Request body must be a JSON object")
  })

  it("rejects a POST with no body and no Content-Type with 400", async () => {
    const response = await testApp.app.inject({ method: "POST", url: path })

    expectJsonError(response, 400, "Request body must be a JSON object")
  })

  it.each(["text/plain", "application/x-www-form-urlencoded"])(
    "rejects a %s body with 415",
    async (contentType) => {
      const response = await postRaw(testApp.app, path, "name=Mary", contentType)

      expectJsonError(response, 415, "Content-Type must be application/json")
    },
  )

  it("rejects a body one byte over 16 KiB with 413", async () => {
    const response = await postRaw(
      testApp.app,
      path,
      jsonBodyOfLength(SIXTEEN_KIB + 1),
      "application/json",
    )

    expectJsonError(response, 413, "Request body too large")
  })

  it("parses a body of exactly 16 KiB", async () => {
    const response = await postRaw(
      testApp.app,
      path,
      jsonBodyOfLength(SIXTEEN_KIB),
      "application/json",
    )

    expect(response.statusCode).toBe(400)
    expect(response.json<{ error: string }>().error).toContain("must be at most")
  })

  it("runs validation on the route", async () => {
    const response = await postRaw(testApp.app, path, "{}", "application/json")

    expect(response.statusCode).toBe(400)
    expect(response.json<{ error: string }>().error).toContain("is required")
  })
})

describe("content type parameters", () => {
  it("accepts a charset parameter", async () => {
    const response = await postRaw(
      testApp.app,
      TEACHERS_PATH,
      JSON.stringify(MARY),
      "application/json; charset=utf-8",
    )

    expect(response.statusCode).toBe(201)
  })
})

describe("unknown route", () => {
  it("returns a JSON 404", async () => {
    const response = await getJson(testApp.app, "/api/nope")

    expectJsonError(response, 404, "Not found")
  })
})
