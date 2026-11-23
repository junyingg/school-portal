import { SPEC_TEACHERS } from "@school-portal/contract"
import type { LightMyRequestResponse } from "fastify"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { buildTestApp, type TestApp } from "./support/buildTestApp.ts"
import {
  CLASSES_PATH,
  TEACHERS_PATH,
  aClassRequest,
  aTeacherRequest,
  postJson,
} from "./support/requests.ts"
import { resetDatabase } from "./support/resetDatabase.ts"

const [MARY] = SPEC_TEACHERS
const PARALLEL_REQUESTS = 10
const ONE_SUCCESS_THEN_CONFLICTS = [
  201,
  ...Array.from({ length: PARALLEL_REQUESTS - 1 }, () => 409),
]

function sortedStatuses(responses: LightMyRequestResponse[]): number[] {
  return responses.map((response) => response.statusCode).toSorted((a, b) => a - b)
}

function conflictMessages(responses: LightMyRequestResponse[]): string[] {
  return responses
    .filter((response) => response.statusCode === 409)
    .map((response) => response.json<{ error: string }>().error)
}

function withCharacterUpperCased(text: string, index: number): string {
  return text.slice(0, index) + text.charAt(index).toUpperCase() + text.slice(index + 1)
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

describe("ten parallel classes for one form teacher", () => {
  it("lets exactly one succeed and rejects the rest with 409", async () => {
    await postJson(testApp.app, TEACHERS_PATH, MARY)

    const responses = await Promise.all(
      Array.from({ length: PARALLEL_REQUESTS }, (_, index) =>
        postJson(testApp.app, CLASSES_PATH, aClassRequest({ name: `Class ${index}` })),
      ),
    )

    expect(sortedStatuses(responses)).toEqual(ONE_SUCCESS_THEN_CONFLICTS)
    expect(new Set(conflictMessages(responses))).toEqual(
      new Set(["Teacher is already the form teacher of another class"]),
    )
  })
})

describe("ten parallel teachers whose emails differ only in case", () => {
  it("lets exactly one succeed and rejects the rest with 409", async () => {
    const responses = await Promise.all(
      Array.from({ length: PARALLEL_REQUESTS }, (_, index) =>
        postJson(
          testApp.app,
          TEACHERS_PATH,
          aTeacherRequest({ email: withCharacterUpperCased(MARY.email, index) }),
        ),
      ),
    )

    expect(sortedStatuses(responses)).toEqual(ONE_SUCCESS_THEN_CONFLICTS)
    expect(new Set(conflictMessages(responses))).toEqual(
      new Set(["A teacher with this email already exists"]),
    )
  })
})
