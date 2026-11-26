import {
  SPEC_CLASSES,
  SPEC_CREATE_CLASS_REQUEST,
  SPEC_TEACHERS,
  type Teacher,
} from "@school-portal/contract"
import type { FastifyInstance, FastifyPluginCallback } from "fastify"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { buildApp } from "./app.ts"
import type { AppServices } from "./composition.ts"
import {
  ClassNotFoundError,
  TeacherNotFoundError,
  UnknownTeacherEmailError,
} from "./errors/domainErrors.ts"
import type { ClassService } from "./modules/classes/classService.ts"
import type { TeacherService } from "./modules/teachers/teacherService.ts"

const [MARY] = SPEC_TEACHERS
const [CLASS_1A] = SPEC_CLASSES

const LEAKY_ERROR_MESSAGE = "select * from teachers where password = 'hunter2'"

function fakeTeacherService(
  registerTeacher: TeacherService["registerTeacher"] = () => Promise.resolve(MARY),
): TeacherService {
  return {
    registerTeacher,
    listTeachers: () => Promise.resolve([MARY]),
    deleteTeacher: () => Promise.resolve(),
  }
}

function fakeClassService(
  addClass: ClassService["addClass"] = () => Promise.resolve(CLASS_1A),
): ClassService {
  return {
    addClass,
    listClasses: () => Promise.resolve([CLASS_1A]),
    deleteClass: () => Promise.resolve(),
  }
}

function fakeServices(overrides: Partial<AppServices> = {}): AppServices {
  return { teacherService: fakeTeacherService(), classService: fakeClassService(), ...overrides }
}

interface StartOptions {
  readonly services?: AppServices
  readonly corsAllowedOrigins?: readonly string[]
  readonly checkReadiness?: () => Promise<void>
}

async function startApp({
  services = fakeServices(),
  corsAllowedOrigins = [],
  checkReadiness = () => Promise.resolve(),
}: StartOptions = {}): Promise<FastifyInstance> {
  const app = await buildApp({
    config: { logLevel: "silent", corsAllowedOrigins },
    services,
    checkReadiness,
  })
  onTestFinished(() => app.close())
  return app
}

function postTeacher(app: FastifyInstance, body: unknown) {
  return app.inject({ method: "POST", url: "/api/teachers", payload: body as object })
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

describe("POST /api/teachers", () => {
  it("passes the trimmed request to the service without unknown fields", async () => {
    const registerTeacher = vi.fn<TeacherService["registerTeacher"]>().mockResolvedValue(MARY)
    const app = await startApp({
      services: fakeServices({ teacherService: fakeTeacherService(registerTeacher) }),
    })

    const response = await postTeacher(app, { ...MARY, name: " Mary ", id: 9 })

    expect(response.statusCode).toBe(201)
    expect(registerTeacher).toHaveBeenCalledExactlyOnceWith(MARY)
  })

  it.each(["name", "email", "contactNumber"])(
    "reports an array %s as the wrong type only",
    async (field) => {
      const app = await startApp()

      const response = await postTeacher(app, { ...MARY, [field]: [] })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toStrictEqual({ error: `${field} must be a string` })
    },
  )

  it("hides a service failure behind a 500", async () => {
    const failingService = fakeTeacherService(() => Promise.reject(new Error(LEAKY_ERROR_MESSAGE)))
    const app = await startApp({ services: fakeServices({ teacherService: failingService }) })

    const response = await postTeacher(app, MARY)

    expect(response.statusCode).toBe(500)
    expect(response.json()).toStrictEqual({ error: "Internal server error" })
  })

  it("replies 500 when the result breaks the response schema", async () => {
    const incompleteTeacher = { name: MARY.name, subject: MARY.subject, email: MARY.email }
    const brokenService = fakeTeacherService(() =>
      Promise.resolve(incompleteTeacher as unknown as Teacher),
    )
    const app = await startApp({ services: fakeServices({ teacherService: brokenService }) })

    const response = await postTeacher(app, MARY)

    expect(response.statusCode).toBe(500)
    expect(response.json()).toStrictEqual({ error: "Internal server error" })
  })
})

describe("POST /api/classes", () => {
  it("replies 400 naming an unknown teacher email", async () => {
    const classService = fakeClassService(() =>
      Promise.reject(new UnknownTeacherEmailError("x@y.co")),
    )
    const app = await startApp({ services: fakeServices({ classService }) })

    const response = await app.inject({
      method: "POST",
      url: "/api/classes",
      payload: { ...SPEC_CREATE_CLASS_REQUEST, teacherEmail: "x@y.co" },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: "No teacher found with email x@y.co" })
  })
})

const ALLOWED_ORIGIN = "https://portal.example"

describe("security headers", () => {
  it("are set on every response, including a 404", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "GET", url: "/nope" })

    expect(response.headers["x-content-type-options"]).toBe("nosniff")
    expect(response.headers["cache-control"]).toBe("no-store")
    expect(response.headers["content-security-policy"]).toContain("default-src 'none'")
    expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'")
    expect(response.headers["x-powered-by"]).toBeUndefined()
  })
})

describe("CORS", () => {
  it("sends no CORS headers when no origins are configured", async () => {
    const app = await startApp()

    const response = await app.inject({
      method: "GET",
      url: "/healthz",
      headers: { origin: ALLOWED_ORIGIN },
    })

    expect(response.headers["access-control-allow-origin"]).toBeUndefined()
  })

  it("allows a configured origin", async () => {
    const app = await startApp({ corsAllowedOrigins: [ALLOWED_ORIGIN] })

    const response = await app.inject({
      method: "GET",
      url: "/healthz",
      headers: { origin: ALLOWED_ORIGIN },
    })

    expect(response.headers["access-control-allow-origin"]).toBe(ALLOWED_ORIGIN)
  })

  it("refuses an origin that is not configured", async () => {
    const app = await startApp({ corsAllowedOrigins: [ALLOWED_ORIGIN] })

    const response = await app.inject({
      method: "GET",
      url: "/healthz",
      headers: { origin: "https://evil.example" },
    })

    expect(response.headers["access-control-allow-origin"]).toBeUndefined()
  })
})

describe("GET /readyz", () => {
  it("replies 200 when the readiness check passes", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "GET", url: "/readyz" })

    expect(response.statusCode).toBe(200)
  })

  it("replies 503 with a JSON error when the readiness check fails", async () => {
    const app = await startApp({
      checkReadiness: () => Promise.reject(new Error("connection refused")),
    })

    const response = await app.inject({ method: "GET", url: "/readyz" })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toStrictEqual({ error: "Service unavailable" })
  })
})

describe("GET /api/teachers", () => {
  it("wraps the service's teachers in data", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "GET", url: "/api/teachers" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toStrictEqual({ data: [MARY] })
  })
})

describe("GET /api/classes", () => {
  it("wraps the service's classes in data", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "GET", url: "/api/classes" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toStrictEqual({ data: [CLASS_1A] })
  })
})

describe("POST /api/classes success", () => {
  it("replies 201 with the created class", async () => {
    const app = await startApp()

    const response = await app.inject({
      method: "POST",
      url: "/api/classes",
      payload: SPEC_CREATE_CLASS_REQUEST,
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toStrictEqual(CLASS_1A)
  })
})

describe("DELETE /api/teachers/:email", () => {
  it("replies 204 with no body once the service deletes the teacher", async () => {
    const deleteTeacher = vi.fn<TeacherService["deleteTeacher"]>().mockResolvedValue()
    const teacherService = { ...fakeTeacherService(), deleteTeacher }
    const app = await startApp({ services: fakeServices({ teacherService }) })

    const response = await app.inject({
      method: "DELETE",
      url: "/api/teachers/teachermary%40gmail.com",
    })

    expect(response.statusCode).toBe(204)
    expect(response.body).toBe("")
    expect(deleteTeacher).toHaveBeenCalledExactlyOnceWith("teachermary@gmail.com")
  })

  it("replies 404 naming an email that matches no teacher", async () => {
    const teacherService = {
      ...fakeTeacherService(),
      deleteTeacher: () => Promise.reject(new TeacherNotFoundError("x@y.co")),
    }
    const app = await startApp({ services: fakeServices({ teacherService }) })

    const response = await app.inject({ method: "DELETE", url: "/api/teachers/x%40y.co" })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toStrictEqual({ error: "No teacher found with email x@y.co" })
  })

  it("replies 400 to a malformed email", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "DELETE", url: "/api/teachers/mary" })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: "email must be a valid email address" })
  })
})

describe("DELETE /api/classes/:teacherEmail", () => {
  it("replies 204 with no body once the service deletes the class", async () => {
    const deleteClass = vi.fn<ClassService["deleteClass"]>().mockResolvedValue()
    const classService = { ...fakeClassService(), deleteClass }
    const app = await startApp({ services: fakeServices({ classService }) })

    const response = await app.inject({
      method: "DELETE",
      url: "/api/classes/teachermary%40gmail.com",
    })

    expect(response.statusCode).toBe(204)
    expect(response.body).toBe("")
    expect(deleteClass).toHaveBeenCalledExactlyOnceWith("teachermary@gmail.com")
  })

  it("replies 404 when the teacher has no class", async () => {
    const classService = {
      ...fakeClassService(),
      deleteClass: () => Promise.reject(new ClassNotFoundError("x@y.co")),
    }
    const app = await startApp({ services: fakeServices({ classService }) })

    const response = await app.inject({ method: "DELETE", url: "/api/classes/x%40y.co" })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toStrictEqual({
      error: "No class found with form teacher email x@y.co",
    })
  })

  it("replies 400 to a malformed email", async () => {
    const app = await startApp()

    const response = await app.inject({ method: "DELETE", url: "/api/classes/mary" })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: "teacherEmail must be a valid email address" })
  })
})
