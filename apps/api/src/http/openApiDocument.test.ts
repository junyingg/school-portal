import { CLASS_LEVELS, SUBJECTS } from "@school-portal/contract"
import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { OPENAPI_DOCUMENT_PATH, generateOpenApiDocument } from "./openApiDocument.ts"

interface OpenApiDocument {
  readonly openapi: string
  readonly paths: Record<string, Record<string, unknown>>
}

async function generatedDocument(): Promise<OpenApiDocument> {
  return JSON.parse(await generateOpenApiDocument()) as OpenApiDocument
}

describe("generateOpenApiDocument", () => {
  it("documents only the API paths", async () => {
    const document = await generatedDocument()

    expect(Object.keys(document.paths)).toEqual([
      "/api/teachers",
      "/api/teachers/{email}",
      "/api/classes",
      "/api/classes/{teacherEmail}",
    ])
  })

  it("documents the supported methods on each path and nothing else", async () => {
    const document = await generatedDocument()

    expect(Object.keys(document.paths["/api/teachers"] ?? {})).toEqual(["post", "get"])
    expect(Object.keys(document.paths["/api/teachers/{email}"] ?? {})).toEqual(["delete"])
    expect(Object.keys(document.paths["/api/classes"] ?? {})).toEqual(["post", "get"])
    expect(Object.keys(document.paths["/api/classes/{teacherEmail}"] ?? {})).toEqual(["delete"])
  })

  it("describes deleting a class: the form teacher's email in the path, 204, and the error replies", async () => {
    const document = await generatedDocument()
    const deletion = document.paths["/api/classes/{teacherEmail}"]?.["delete"]

    expect(deletion).toMatchObject({
      parameters: [{ in: "path", name: "teacherEmail", required: true }],
    })
    expect(Object.keys((deletion as { responses: object }).responses)).toEqual([
      "204",
      "400",
      "404",
      "500",
    ])
  })

  it("describes deleting a teacher: the email in the path, 204, and the error replies", async () => {
    const document = await generatedDocument()
    const deletion = document.paths["/api/teachers/{email}"]?.["delete"]

    expect(deletion).toMatchObject({
      parameters: [{ in: "path", name: "email", required: true }],
    })
    expect(Object.keys((deletion as { responses: object }).responses)).toEqual([
      "204",
      "400",
      "404",
      "409",
      "500",
    ])
  })

  it("describes the request bodies from the contract schemas", async () => {
    const document = await generatedDocument()

    expect(document.paths["/api/teachers"]).toMatchObject({
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: { required: ["name", "subject", "email", "contactNumber"] },
            },
          },
        },
      },
    })
    expect(document.paths["/api/classes"]).toMatchObject({
      post: {
        requestBody: {
          content: {
            "application/json": { schema: { required: ["level", "name", "teacherEmail"] } },
          },
        },
      },
    })
  })

  it("lists the allowed subject and level values", async () => {
    const document = await generatedDocument()

    expect(document.paths["/api/teachers"]).toMatchObject({
      post: {
        requestBody: {
          content: {
            "application/json": { schema: { properties: { subject: { enum: [...SUBJECTS] } } } },
          },
        },
      },
    })
    expect(document.paths["/api/classes"]).toMatchObject({
      post: {
        requestBody: {
          content: {
            "application/json": { schema: { properties: { level: { enum: [...CLASS_LEVELS] } } } },
          },
        },
      },
    })
  })

  it("matches the committed openapi.json", async () => {
    const committed = await readFile(OPENAPI_DOCUMENT_PATH, "utf8")

    expect(committed).toBe(await generateOpenApiDocument())
  })
})
