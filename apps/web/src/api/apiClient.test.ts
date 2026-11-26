import {
  TEACHER_EMAIL_TAKEN_MESSAGE,
  TEACHER_IS_FORM_TEACHER_MESSAGE,
  teacherListResponseSchema,
  teacherSchema,
} from "@school-portal/contract"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { designTeachers } from "../test/designFixtures.ts"
import {
  createTeacherFails,
  htmlBadGateway,
  networkError,
  TEACHERS_URL,
} from "../test/msw/handlers.ts"
import { server, setupMswServer } from "../test/msw/server.ts"
import { ApiError } from "./ApiError.ts"
import { deleteResource, getJson, postJson } from "./apiClient.ts"

setupMswServer()

const [HANNAH] = designTeachers
const GENERIC_MESSAGE = "Something went wrong. Please try again."

describe("getJson", () => {
  it("parses the response with the contract schema and drops unknown keys", async () => {
    server.use(http.get(TEACHERS_URL, () => HttpResponse.json({ data: [{ ...HANNAH, id: 1 }] })))

    await expect(getJson(TEACHERS_URL, teacherListResponseSchema)).resolves.toStrictEqual({
      data: [HANNAH],
    })
  })

  it("rejects a body that breaks the contract", async () => {
    server.use(http.get(TEACHERS_URL, () => HttpResponse.json({ data: [{ name: 1 }] })))

    await expect(getJson(TEACHERS_URL, teacherListResponseSchema)).rejects.toBeInstanceOf(ApiError)
  })
})

describe("postJson", () => {
  it("sends the body as JSON and parses the created resource", async () => {
    const received: { contentType: string | null; body: unknown }[] = []
    server.use(
      http.post(TEACHERS_URL, async ({ request }) => {
        received.push({
          contentType: request.headers.get("content-type"),
          body: await request.json(),
        })
        return HttpResponse.json(HANNAH, { status: 201 })
      }),
    )

    await expect(postJson(TEACHERS_URL, HANNAH, teacherSchema)).resolves.toStrictEqual(HANNAH)
    expect(received).toStrictEqual([{ contentType: "application/json", body: HANNAH }])
  })

  it("rejects a 201 whose body breaks the contract", async () => {
    server.use(http.post(TEACHERS_URL, () => HttpResponse.json({}, { status: 201 })))

    await expect(postJson(TEACHERS_URL, HANNAH, teacherSchema)).rejects.toBeInstanceOf(ApiError)
  })
})

describe("ApiError", () => {
  it("carries the status and the server's error message", async () => {
    server.use(createTeacherFails(409, TEACHER_EMAIL_TAKEN_MESSAGE))

    const request = postJson(TEACHERS_URL, HANNAH, teacherSchema)

    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({
      status: 409,
      message: TEACHER_EMAIL_TAKEN_MESSAGE,
    })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(htmlBadGateway("get", TEACHERS_URL))

    await expect(getJson(TEACHERS_URL, teacherListResponseSchema)).rejects.toMatchObject({
      status: 502,
      message: GENERIC_MESSAGE,
    })
  })

  it("reports a network failure as status 0", async () => {
    server.use(networkError("get", TEACHERS_URL))

    await expect(getJson(TEACHERS_URL, teacherListResponseSchema)).rejects.toMatchObject({
      status: 0,
      message: GENERIC_MESSAGE,
    })
  })
})

describe("deleteResource", () => {
  it("resolves once the server replies 204", async () => {
    server.use(http.delete(`${TEACHERS_URL}/:email`, () => new HttpResponse(null, { status: 204 })))

    await expect(deleteResource(`${TEACHERS_URL}/x%40y.co`)).resolves.toBeUndefined()
  })

  it("carries the status and the server's error message", async () => {
    server.use(
      http.delete(`${TEACHERS_URL}/:email`, () =>
        HttpResponse.json({ error: TEACHER_IS_FORM_TEACHER_MESSAGE }, { status: 409 }),
      ),
    )

    await expect(deleteResource(`${TEACHERS_URL}/x%40y.co`)).rejects.toMatchObject({
      status: 409,
      message: TEACHER_IS_FORM_TEACHER_MESSAGE,
    })
  })
})
