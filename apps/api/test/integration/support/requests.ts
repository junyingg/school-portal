import { SPEC_TEACHERS, type CreateTeacherRequest } from "@school-portal/contract"
import type { FastifyInstance, LightMyRequestResponse } from "fastify"

export const TEACHERS_PATH = "/api/teachers"
export const JSON_CONTENT_TYPE = "application/json; charset=utf-8"

const [MARY] = SPEC_TEACHERS

export function postJson(
  app: FastifyInstance,
  url: string,
  body: unknown,
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "POST",
    url,
    headers: { "content-type": "application/json" },
    payload: JSON.stringify(body),
  })
}

export function postRaw(
  app: FastifyInstance,
  url: string,
  payload: string,
  contentType: string,
): Promise<LightMyRequestResponse> {
  return app.inject({ method: "POST", url, headers: { "content-type": contentType }, payload })
}

export function getJson(app: FastifyInstance, url: string): Promise<LightMyRequestResponse> {
  return app.inject({ method: "GET", url })
}

export function aTeacherRequest(
  overrides: Partial<Record<keyof CreateTeacherRequest, unknown>> = {},
): Record<string, unknown> {
  return { ...MARY, ...overrides }
}
