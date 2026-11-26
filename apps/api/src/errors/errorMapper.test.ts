import { createTeacherRequestSchema } from "@school-portal/contract"
import { errorCodes } from "fastify"
import { validatorCompiler } from "fastify-type-provider-zod"
import { describe, expect, it } from "vitest"
import {
  ClassNotFoundError,
  TeacherIsFormTeacherError,
  TeacherNotFoundError,
  UnknownTeacherEmailError,
} from "./domainErrors.ts"
import { mapErrorToReply, type ErrorReply } from "./errorMapper.ts"

interface MappingCase {
  readonly description: string
  readonly input: unknown
  readonly expected: ErrorReply
}

function clientFault(statusCode: number, message: string): ErrorReply {
  return { statusCode, message, isServerFault: false }
}

const SERVER_FAULT: ErrorReply = {
  statusCode: 500,
  message: "Internal server error",
  isServerFault: true,
}

const validateTeacherBody = validatorCompiler({
  schema: createTeacherRequestSchema,
  method: "POST",
  url: "/api/teachers",
  httpPart: "body",
}) as (input: unknown) => { error?: unknown }

function bodyValidationError(input: unknown, repeat = 1) {
  const { error: issues } = validateTeacherBody(input)
  if (!Array.isArray(issues)) {
    throw new Error("expected the input to fail validation")
  }
  const validationIssues: unknown[] = issues
  return {
    statusCode: 400,
    code: "FST_ERR_VALIDATION",
    validationContext: "body",
    validation: Array.from({ length: repeat }, () => validationIssues).flat(),
  }
}

function uniqueViolation(constraint: string) {
  return Object.assign(
    new Error(`duplicate key value violates unique constraint "${constraint}"`),
    {
      code: "23505",
      constraint,
    },
  )
}

const INVALID_NAME_AND_EMAIL = {
  name: "",
  subject: "Mathematics",
  email: "mary",
  contactNumber: "61234567",
}

const CASES: MappingCase[] = [
  { description: "a thrown string", input: "boom", expected: SERVER_FAULT },
  { description: "undefined", input: undefined, expected: SERVER_FAULT },
  {
    description: "an empty JSON body",
    input: new errorCodes.FST_ERR_CTP_EMPTY_JSON_BODY(),
    expected: clientFault(400, "Request body must be a JSON object"),
  },
  {
    description: "a body that is not an object",
    input: bodyValidationError([]),
    expected: clientFault(400, "Request body must be a JSON object"),
  },
  {
    description: "field validation issues joined in order",
    input: bodyValidationError(INVALID_NAME_AND_EMAIL),
    expected: clientFault(400, "name is required; email must be a valid email address"),
  },
  {
    description: "repeated validation messages only once",
    input: bodyValidationError(INVALID_NAME_AND_EMAIL, 2),
    expected: clientFault(400, "name is required; email must be a valid email address"),
  },
  {
    description: "a duplicate teacher email",
    input: uniqueViolation("teachers_email_lower_key"),
    expected: clientFault(409, "A teacher with this email already exists"),
  },
  {
    description: "an unknown teacher email",
    input: new UnknownTeacherEmailError("x@y.co"),
    expected: clientFault(400, "No teacher found with email x@y.co"),
  },
  {
    description: "a form teacher who already has a class",
    input: uniqueViolation("classes_form_teacher_id_key"),
    expected: clientFault(409, "Teacher is already the form teacher of another class"),
  },
  {
    description: "an unknown unique constraint",
    input: uniqueViolation("other_key"),
    expected: clientFault(409, "Resource already exists"),
  },
  {
    description: "malformed JSON",
    input: new errorCodes.FST_ERR_CTP_INVALID_JSON_BODY(),
    expected: clientFault(400, "Request body must be valid JSON"),
  },
  {
    description: "a Content-Length mismatch",
    input: new errorCodes.FST_ERR_CTP_INVALID_CONTENT_LENGTH(),
    expected: clientFault(400, "Request body size did not match Content-Length"),
  },
  {
    description: "a non-JSON media type",
    input: new errorCodes.FST_ERR_CTP_INVALID_MEDIA_TYPE(),
    expected: clientFault(415, "Content-Type must be application/json"),
  },
  {
    description: "a body over the limit",
    input: new errorCodes.FST_ERR_CTP_BODY_TOO_LARGE(),
    expected: clientFault(413, "Request body too large"),
  },
  {
    description: "another 404 without leaking its message",
    input: { statusCode: 404, message: "secret" },
    expected: clientFault(404, "Not Found"),
  },
  {
    description: "another 408 without leaking its message",
    input: { statusCode: 408, message: "secret" },
    expected: clientFault(408, "Request Timeout"),
  },
  {
    description: "a 4xx with no standard reason phrase",
    input: { statusCode: 499, message: "secret" },
    expected: clientFault(499, "Bad Request"),
  },
  { description: "a foreign-key violation", input: { code: "23503" }, expected: SERVER_FAULT },
  {
    description: "a plain Error",
    input: new Error("select * from teachers"),
    expected: SERVER_FAULT,
  },
  {
    description: "a teacher who does not exist",
    input: new TeacherNotFoundError("x@y.co"),
    expected: clientFault(404, "No teacher found with email x@y.co"),
  },
  {
    description: "a teacher who is still a form teacher",
    input: new TeacherIsFormTeacherError("x@y.co"),
    expected: clientFault(409, "Teacher is the form teacher of a class and cannot be deleted"),
  },
  {
    description: "a class that does not exist",
    input: new ClassNotFoundError("x@y.co"),
    expected: clientFault(404, "No class found with form teacher email x@y.co"),
  },
]

describe("mapErrorToReply", () => {
  it.each(CASES)("maps $description", ({ input, expected }) => {
    expect(mapErrorToReply(input)).toStrictEqual(expected)
  })
})
