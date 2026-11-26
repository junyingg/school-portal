import { SPEC_TEACHERS, SUBJECT_NOT_LISTED_MESSAGE } from "@school-portal/contract"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { buildTestApp, type TestApp } from "./support/buildTestApp.ts"
import {
  CLASSES_PATH,
  TEACHERS_PATH,
  aClassRequest,
  aTeacherRequest,
  deleteResource,
  getJson,
  postJson,
} from "./support/requests.ts"
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

  it.each(["81234567", "91234567"])("accepts the mobile number %s", async (contactNumber) => {
    const response = await postJson(testApp.app, TEACHERS_PATH, aTeacherRequest({ contactNumber }))

    expect(response.statusCode).toBe(201)
  })

  it("rejects an unlisted subject", async () => {
    const response = await postJson(
      testApp.app,
      TEACHERS_PATH,
      aTeacherRequest({ subject: "Chemistry" }),
    )

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: SUBJECT_NOT_LISTED_MESSAGE })
  })

  it.each([
    ["6123 4567", "contactNumber must be 8 digits starting with 6, 8 or 9"],
    ["6123-4567", "contactNumber must be 8 digits starting with 6, 8 or 9"],
    ["71234567", "contactNumber must be 8 digits starting with 6, 8 or 9"],
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

describe("DELETE /api/teachers/{email}", () => {
  it("deletes the teacher regardless of email case and replies 204 with no body", async () => {
    await postJson(testApp.app, TEACHERS_PATH, MARY)

    const response = await deleteResource(testApp.app, `${TEACHERS_PATH}/TEACHERMARY%40GMAIL.COM`)

    expect(response.statusCode).toBe(204)
    expect(response.body).toBe("")
    expect((await getJson(testApp.app, TEACHERS_PATH)).json()).toStrictEqual({ data: [] })
  })

  it("replies 404 naming an email that matches no teacher", async () => {
    const response = await deleteResource(testApp.app, `${TEACHERS_PATH}/nobody%40example.com`)

    expect(response.statusCode).toBe(404)
    expect(response.json()).toStrictEqual({
      error: "No teacher found with email nobody@example.com",
    })
  })

  it("refuses to delete a form teacher with 409 and keeps the teacher", async () => {
    await postJson(testApp.app, TEACHERS_PATH, MARY)
    await postJson(testApp.app, CLASSES_PATH, aClassRequest())

    const response = await deleteResource(testApp.app, `${TEACHERS_PATH}/${MARY.email}`)

    expect(response.statusCode).toBe(409)
    expect(response.json()).toStrictEqual({
      error: "Teacher is the form teacher of a class and cannot be deleted",
    })
    expect((await getJson(testApp.app, TEACHERS_PATH)).json()).toStrictEqual({ data: [MARY] })
  })

  it("rejects a malformed email with 400", async () => {
    const response = await deleteResource(testApp.app, `${TEACHERS_PATH}/mary`)

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: "email must be a valid email address" })
  })
})
