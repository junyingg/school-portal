import { SPEC_TEACHERS } from "@school-portal/contract"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { buildTestApp, type TestApp } from "./support/buildTestApp.ts"
import { TEACHERS_PATH, aTeacherRequest, getJson, postJson } from "./support/requests.ts"
import { resetDatabase } from "./support/resetDatabase.ts"

const [MARY, KEN] = SPEC_TEACHERS

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

describe("POST /api/teachers", () => {
  it("returns 201 with the teacher in spec key order", async () => {
    const response = await postJson(testApp.app, TEACHERS_PATH, MARY)

    expect(response.statusCode).toBe(201)
    expect(response.json()).toStrictEqual(MARY)
    expect(response.body).toBe(
      '{"name":"Mary","subject":"Mathematics","email":"teachermary@gmail.com","contactNumber":"68129414"}',
    )
  })

  it("rejects an email that differs only in case with 409", async () => {
    await postJson(testApp.app, TEACHERS_PATH, aTeacherRequest({ email: "TEACHERMARY@GMAIL.COM" }))

    const response = await postJson(testApp.app, TEACHERS_PATH, MARY)

    expect(response.statusCode).toBe(409)
    expect(response.json()).toStrictEqual({ error: "A teacher with this email already exists" })
  })

  it("allows two teachers with the same name", async () => {
    const first = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ name: "Gao Ah Xing", email: "gao.one@example.com" }),
    )
    const second = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ name: "Gao Ah Xing", email: "gao.two@example.com" }),
    )

    expect([first.statusCode, second.statusCode]).toEqual([201, 201])
  })

  it("accepts a contact number that does not start with 6", async () => {
    const response = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ contactNumber: "91234567" }),
    )

    expect(response.statusCode).toBe(201)
  })

  it("accepts a subject outside the design list", async () => {
    const response = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ subject: "Chemistry" }),
    )

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ subject: "Chemistry" })
  })

  it("accepts a formatted contact number and stores its digits", async () => {
    const response = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ contactNumber: "6123 4567" }),
    )

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ contactNumber: "61234567" })
  })

  it.each([
    ["6123-4567", "contactNumber must be 8 digits"],
    [68129414, "contactNumber must be a string"],
  ])("rejects the contact number %j", async (contactNumber, message) => {
    const response = await postJson(testApp.app, TEACHERS_PATH, aTeacherRequest({ contactNumber }))

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: message })
  })

  it("ignores unknown fields", async () => {
    const response = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ id: 99 } as never),
    )

    expect(response.statusCode).toBe(201)
    expect(response.json()).toStrictEqual(MARY)
  })
})

describe("GET /api/teachers", () => {
  it("returns an empty data array when no teachers exist", async () => {
    const response = await getJson(testApp.app, TEACHERS_PATH)

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('{"data":[]}')
  })

  it("lists teachers in insertion order", async () => {
    await postJson(testApp.app, TEACHERS_PATH, MARY)
    await postJson(testApp.app, TEACHERS_PATH, KEN)

    const response = await getJson(testApp.app, TEACHERS_PATH)

    expect(response.json()).toStrictEqual({ data: [MARY, KEN] })
  })

  it("keeps the email casing as sent", async () => {
    await postJson(testApp.app, TEACHERS_PATH, aTeacherRequest({ email: "TeacherMary@Gmail.com" }))

    const response = await getJson(testApp.app, TEACHERS_PATH)

    expect(response.json()).toStrictEqual({ data: [{ ...MARY, email: "TeacherMary@Gmail.com" }] })
  })
})
