import { STATUS_CODES } from "node:http"
import {
  BODY_TOO_LARGE_MESSAGE,
  CONTENT_LENGTH_MISMATCH_MESSAGE,
  INTERNAL_ERROR_MESSAGE,
  INVALID_JSON_MESSAGE,
  NOT_AN_OBJECT_MESSAGE,
  UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from "@school-portal/contract"

export interface ErrorReply {
  readonly statusCode: number
  readonly message: string
  readonly isServerFault: boolean
}

const HTTP_BAD_REQUEST = 400
const HTTP_PAYLOAD_TOO_LARGE = 413
const HTTP_UNSUPPORTED_MEDIA_TYPE = 415
const HTTP_INTERNAL_SERVER_ERROR = 500
const BAD_REQUEST_REASON = "Bad Request"

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

export function mapErrorToReply(error: unknown): ErrorReply {
  if (!isObject(error)) {
    return INTERNAL_ERROR_REPLY
  }

  const code = errorCodeOf(error)
  const bodyErrorReply = code === undefined ? undefined : FASTIFY_BODY_ERROR_REPLIES.get(code)
  if (bodyErrorReply !== undefined) {
    return bodyErrorReply
  }

  const clientErrorStatus = clientErrorStatusOf(error)
  if (clientErrorStatus !== undefined) {
    return clientFault(clientErrorStatus, reasonPhraseFor(clientErrorStatus))
  }

  return INTERNAL_ERROR_REPLY
}
