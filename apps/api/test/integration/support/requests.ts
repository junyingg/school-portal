import {
  SPEC_CREATE_CLASS_REQUEST,
  SPEC_TEACHERS,
  type CreateClassRequest,
  type CreateTeacherRequest,
} from "@school-portal/contract"
import type { FastifyInstance, LightMyRequestResponse } from "fastify"

export const TEACHERS_PATH = "/api/teachers"
export const CLASSES_PATH = "/api/classes"
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

export function aClassRequest(
  overrides: Partial<Record<keyof CreateClassRequest, unknown>> = {},
): Record<string, unknown> {
  return { ...SPEC_CREATE_CLASS_REQUEST, ...overrides }
}

export function deleteResource(app: FastifyInstance, url: string): Promise<LightMyRequestResponse> {
  return app.inject({ method: "DELETE", url })
}
