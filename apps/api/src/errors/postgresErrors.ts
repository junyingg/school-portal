import {
  FORM_TEACHER_TAKEN_MESSAGE,
  RESOURCE_EXISTS_MESSAGE,
  TEACHER_EMAIL_TAKEN_MESSAGE,
} from "@school-portal/contract"
import { CLASSES_FORM_TEACHER_ID_KEY, TEACHERS_EMAIL_LOWER_KEY } from "../db/constraintNames.ts"

const UNIQUE_VIOLATION_CODE = "23505"
const RESTRICT_VIOLATION_CODE = "23001"

export interface UniqueViolation {
  readonly code: typeof UNIQUE_VIOLATION_CODE
  readonly constraint?: unknown
}

const CONFLICT_MESSAGES_BY_CONSTRAINT = new Map<string, string>([
  [TEACHERS_EMAIL_LOWER_KEY, TEACHER_EMAIL_TAKEN_MESSAGE],
  [CLASSES_FORM_TEACHER_ID_KEY, FORM_TEACHER_TAKEN_MESSAGE],
])

export function isUniqueViolation(error: object): error is UniqueViolation {
  return "code" in error && error.code === UNIQUE_VIOLATION_CODE
}

export function conflictMessageFor(constraint: unknown): string {
  const message =
    typeof constraint === "string" ? CONFLICT_MESSAGES_BY_CONSTRAINT.get(constraint) : undefined
  return message ?? RESOURCE_EXISTS_MESSAGE
}

export function isRestrictViolationOn(error: unknown, constraint: string): boolean {
  if (typeof error !== "object" || error === null) {
    return false
  }
  const hasRestrictCode = "code" in error && error.code === RESTRICT_VIOLATION_CODE
  return hasRestrictCode && "constraint" in error && error.constraint === constraint
}
