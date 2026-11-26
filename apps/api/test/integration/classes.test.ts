import { LEVEL_NOT_LISTED_MESSAGE, SPEC_CLASSES, SPEC_TEACHERS } from "@school-portal/contract"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { buildTestApp, type TestApp } from "./support/buildTestApp.ts"
import {
  CLASSES_PATH,
  TEACHERS_PATH,
  aClassRequest,
  getJson,
  postJson,
} from "./support/requests.ts"
import { resetDatabase } from "./support/resetDatabase.ts"

const [MARY, KEN] = SPEC_TEACHERS
const [CLASS_1A, CLASS_2B] = SPEC_CLASSES
const FORM_TEACHER_TAKEN = { error: "Teacher is already the form teacher of another class" }

let testApp: TestApp

beforeAll(async () => {
  testApp = await buildTestApp()
})

afterAll(async () => {
  await testApp.close()
})

beforeEach(async () => {
  await resetDatabase()
  await postJson(testApp.app, TEACHERS_PATH, MARY)
  await postJson(testApp.app, TEACHERS_PATH, KEN)
})

describe("POST /api/classes", () => {
  it("returns 201 with the form teacher's name and email, in key order", async () => {
    const response = await postJson(testApp.app, CLASSES_PATH, aClassRequest())

    expect(response.statusCode).toBe(201)
    expect(response.body).toBe(
      '{"level":"Primary 1","name":"Class 1A","formTeacher":{"name":"Mary","email":"teachermary@gmail.com"}}',
    )
  })

  it("finds the form teacher regardless of email case", async () => {
    const response = await postJson(
      testApp.app,
      CLASSES_PATH,
      aClassRequest({ teacherEmail: "TEACHERMARY@GMAIL.COM" }),
    )

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ formTeacher: { email: "teachermary@gmail.com" } })
  })

  it("rejects an unknown teacher email with 400", async () => {
    const response = await postJson(
      testApp.app,
      CLASSES_PATH,
      aClassRequest({ teacherEmail: "nobody@example.com" }),
    )

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({
      error: "No teacher found with email nobody@example.com",
    })
  })

  it("rejects a teacher who is already a form teacher with 409", async () => {
    await postJson(testApp.app, CLASSES_PATH, aClassRequest())

    const response = await postJson(testApp.app, CLASSES_PATH, aClassRequest({ name: "Class 1B" }))

    expect(response.statusCode).toBe(409)
    expect(response.json()).toStrictEqual(FORM_TEACHER_TAKEN)
  })

  it("rejects the spec class payload sent twice", async () => {
    await postJson(testApp.app, CLASSES_PATH, aClassRequest())

    const response = await postJson(testApp.app, CLASSES_PATH, aClassRequest())

    expect(response.statusCode).toBe(409)
    expect(response.json()).toStrictEqual(FORM_TEACHER_TAKEN)
  })

  it("allows the same level and name for different form teachers", async () => {
    const first = await postJson(testApp.app, CLASSES_PATH, aClassRequest())
    const second = await postJson(
      testApp.app,
      CLASSES_PATH,
      aClassRequest({ teacherEmail: KEN.email }),
    )

    expect([first.statusCode, second.statusCode]).toEqual([201, 201])
  })

  it("rejects an unlisted level", async () => {
    const response = await postJson(
      testApp.app,
      CLASSES_PATH,
      aClassRequest({ level: "Secondary 1" }),
    )

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: LEVEL_NOT_LISTED_MESSAGE })
  })
})

describe("GET /api/classes", () => {
  it("returns an empty data array when no classes exist", async () => {
    const response = await getJson(testApp.app, CLASSES_PATH)

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('{"data":[]}')
  })

  it("lists classes in insertion order with the form teacher's name and email", async () => {
    await postJson(
      testApp.app,
      CLASSES_PATH,
      aClassRequest({ level: "Primary 2", name: "Class 2B", teacherEmail: KEN.email }),
    )
    await postJson(testApp.app, CLASSES_PATH, aClassRequest())

    const response = await getJson(testApp.app, CLASSES_PATH)

    expect(response.json()).toStrictEqual({
      data: [
        { ...CLASS_2B, formTeacher: { name: KEN.name, email: KEN.email } },
        { ...CLASS_1A, formTeacher: { name: MARY.name, email: MARY.email } },
      ],
    })
  })

  it.each([
    ["an unknown teacher email", { teacherEmail: "nobody@example.com" }],
    ["an unlisted level", { level: "Secondary 1" }],
  ])("stores nothing after %s", async (_case, overrides) => {
    await postJson(testApp.app, CLASSES_PATH, aClassRequest(overrides))

    const response = await getJson(testApp.app, CLASSES_PATH)

    expect(response.json()).toStrictEqual({ data: [] })
  })
})
