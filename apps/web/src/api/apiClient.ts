import { errorResponseSchema } from "@school-portal/contract"
import type { z } from "zod"
import { ApiError, GENERIC_ERROR_MESSAGE, NETWORK_FAILURE_STATUS } from "./ApiError.ts"

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString()
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(absoluteUrl(path), init)
  } catch {
    throw new ApiError(NETWORK_FAILURE_STATUS, GENERIC_ERROR_MESSAGE)
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    return undefined
  }
}

async function errorMessageOf(response: Response): Promise<string> {
  const parsed = errorResponseSchema.safeParse(await readJson(response))
  return parsed.success ? parsed.data.error : GENERIC_ERROR_MESSAGE
}

async function parseResponse<Schema extends z.ZodType>(
  response: Response,
  schema: Schema,
): Promise<z.output<Schema>> {
  if (!response.ok) {
    throw new ApiError(response.status, await errorMessageOf(response))
  }
  const parsed = schema.safeParse(await readJson(response))
  if (!parsed.success) {
    throw new ApiError(response.status, GENERIC_ERROR_MESSAGE)
  }
  return parsed.data
}

export async function getJson<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
): Promise<z.output<Schema>> {
  const response = await send(path, { method: "GET", headers: { accept: "application/json" } })
  return parseResponse(response, schema)
}

export async function postJson<Schema extends z.ZodType>(
  path: string,
  body: unknown,
  schema: Schema,
): Promise<z.output<Schema>> {
  const response = await send(path, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseResponse(response, schema)
}
