import { CLASS_LEVEL_MAX_LENGTH, SUBJECT_MAX_LENGTH } from "@school-portal/contract"
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
  it("documents only the two API paths", async () => {
    const document = await generatedDocument()

    expect(Object.keys(document.paths)).toEqual(["/api/teachers", "/api/classes"])
  })

  it("documents GET and POST on each path and nothing else", async () => {
    const document = await generatedDocument()

    expect(Object.keys(document.paths["/api/teachers"] ?? {})).toEqual(["post", "get"])
    expect(Object.keys(document.paths["/api/classes"] ?? {})).toEqual(["post", "get"])
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

  it("describes subject and level as bounded free strings", async () => {
    const document = await generatedDocument()

    expect(document.paths["/api/teachers"]).toMatchObject({
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  subject: { type: "string", maxLength: SUBJECT_MAX_LENGTH },
                },
              },
            },
          },
        },
      },
    })
    expect(document.paths["/api/classes"]).toMatchObject({
      post: {
        requestBody: {
          content: {
            "application/json": {
              schema: {
                properties: {
                  level: { type: "string", maxLength: CLASS_LEVEL_MAX_LENGTH },
                },
              },
            },
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
