import { fileURLToPath } from "node:url"
import { buildApp } from "../app.ts"
import type { AppServices } from "../composition.ts"

export const OPENAPI_DOCUMENT_PATH = fileURLToPath(new URL("../../openapi.json", import.meta.url))

const JSON_INDENT = 2

function unavailable(): Promise<never> {
  return Promise.reject(new Error("Services are not available while generating the API document"))
}

const UNAVAILABLE_SERVICES: AppServices = {
  teacherService: { registerTeacher: unavailable, listTeachers: unavailable },
  classService: { addClass: unavailable, listClasses: unavailable },
}

export async function generateOpenApiDocument(): Promise<string> {
  const app = await buildApp({
    config: { logLevel: "silent", corsAllowedOrigins: [] },
    services: UNAVAILABLE_SERVICES,
    checkReadiness: () => Promise.resolve(),
  })
  try {
    await app.ready()
    return `${JSON.stringify(app.swagger(), null, JSON_INDENT)}\n`
  } finally {
    await app.close()
  }
}
