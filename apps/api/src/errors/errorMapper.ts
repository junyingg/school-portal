import { STATUS_CODES } from "node:http"
import {
  BODY_TOO_LARGE_MESSAGE,
  CONTENT_LENGTH_MISMATCH_MESSAGE,
  INTERNAL_ERROR_MESSAGE,
  INVALID_JSON_MESSAGE,
  NOT_AN_OBJECT_MESSAGE,
  RESOURCE_EXISTS_MESSAGE,
  TEACHER_EMAIL_TAKEN_MESSAGE,
  UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from "@school-portal/contract"
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod"
import { TEACHERS_EMAIL_LOWER_KEY } from "../db/constraintNames.ts"
import { toValidationMessage } from "./validationMessage.ts"

export interface ErrorReply {
  readonly statusCode: number
  readonly message: string
  readonly isServerFault: boolean
}

const HTTP_BAD_REQUEST = 400
const HTTP_CONFLICT = 409
const HTTP_PAYLOAD_TOO_LARGE = 413
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415
const HTTP_INTERNAL_SERVER_ERROR = 500
const BAD_REQUEST_REASON = "Bad Request"
const UNIQUE_VIOLATION_CODE = "23505"

const INTERNAL_ERROR_REPLY: ErrorReply = {
  statusCode: HTTP_INTERNAL_SERVER_ERROR,
  message: INTERNAL_ERROR_MESSAGE,
  isServerFault: true,
}

function clientFault(statusCode: number, message: string): ErrorReply {
  return { statusCode, message, isServerFault: false }
}

const FASTIFY_BODY_ERROR_REPLIES = new Map<string, ErrorReply>([
  ["FST_ERR_CTP_INVALID_JSON_BODY", clientFault(HTTP_BAD_REQUEST, INVALID_JSON_MESSAGE)],
  ["FST_ERR_CTP_EMPTY_JSON_BODY", clientFault(HTTP_BAD_REQUEST, NOT_AN_OBJECT_MESSAGE)],
  [
    "FST_ERR_CTP_INVALID_CONTENT_LENGTH",
    clientFault(HTTP_BAD_REQUEST, CONTENT_LENGTH_MISMATCH_MESSAGE),
  ],
  [
    "FST_ERR_CTP_INVALID_MEDIA_TYPE",
    clientFault(HTTP_UNSUPPORTED_MEDIA_TYPE, UNSUPPORTED_MEDIA_TYPE_MESSAGE),
  ],
  ["FST_ERR_CTP_BODY_TOO_LARGE", clientFault(HTTP_PAYLOAD_TOO_LARGE, BODY_TOO_LARGE_MESSAGE)],
])

function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null
}

function errorCodeOf(error: object): string | undefined {
  if ("code" in error && typeof error.code === "string") {
    return error.code
  }
  return undefined
}

function constraintOf(error: object): string | undefined {
  if ("constraint" in error && typeof error.constraint === "string") {
    return error.constraint
  }
  return undefined
}

function clientErrorStatusOf(error: object): number | undefined {
  if (!("statusCode" in error) || typeof error.statusCode !== "number") {
    return undefined
  }
  const isClientError =
    error.statusCode >= HTTP_BAD_REQUEST && error.statusCode < HTTP_INTERNAL_SERVER_ERROR
  return isClientError ? error.statusCode : undefined
}

function reasonPhraseFor(statusCode: number): string {
  return STATUS_CODES[statusCode] ?? BAD_REQUEST_REASON
}

function conflictMessageFor(constraint: string | undefined): string {
  return constraint === TEACHERS_EMAIL_LOWER_KEY
    ? TEACHER_EMAIL_TAKEN_MESSAGE
    : RESOURCE_EXISTS_MESSAGE
}

export function mapErrorToReply(error: unknown): ErrorReply {
  if (!isObject(error)) {
    return INTERNAL_ERROR_REPLY
  }

  if (hasZodFastifySchemaValidationErrors(error)) {
    return clientFault(HTTP_BAD_REQUEST, toValidationMessage(error.validation))
  }

  const code = errorCodeOf(error)
  const bodyErrorReply = code === undefined ? undefined : FASTIFY_BODY_ERROR_REPLIES.get(code)
  if (bodyErrorReply !== undefined) {
    return bodyErrorReply
  }

  if (code === UNIQUE_VIOLATION_CODE) {
    return clientFault(HTTP_CONFLICT, conflictMessageFor(constraintOf(error)))
  }

  const clientErrorStatus = clientErrorStatusOf(error)
  if (clientErrorStatus !== undefined) {
    return clientFault(clientErrorStatus, reasonPhraseFor(clientErrorStatus))
  }

  return INTERNAL_ERROR_REPLY
}
