import { z } from "zod"
import { CLASS_LEVELS, SUBJECTS } from "./optionLists.ts"

export const NAME_MAX_LENGTH = 100
export const EMAIL_MAX_LENGTH = 254
export const CLASS_NAME_MAX_LENGTH = 50
export const CONTACT_NUMBER_PATTERN = /^\d{8}$/
export const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const CONTROL_CHARACTER_PATTERN = /\p{Cc}/u
export const CONTACT_NUMBER_MESSAGE = "contactNumber must be 8 digits"
export const SUBJECT_NOT_LISTED_MESSAGE = `subject must be one of: ${SUBJECTS.join(", ")}`
export const LEVEL_NOT_LISTED_MESSAGE = `level must be one of: ${CLASS_LEVELS.join(", ")}`

function requiredMessage(field: string): string {
  return `${field} is required`
}

export function requiredString(field: string) {
  return z
    .string({
      error: (issue) =>
        issue.input === undefined ? requiredMessage(field) : `${field} must be a string`,
    })
    .trim()
    .min(1, { error: requiredMessage(field), abort: true })
}

export function requiredText(field: string, maxLength: number) {
  return requiredString(field).max(maxLength, `${field} must be at most ${maxLength} characters`)
}

export function personName(field: string) {
  return requiredText(field, NAME_MAX_LENGTH).refine(
    (value) => !CONTROL_CHARACTER_PATTERN.test(value),
    `${field} must not contain control characters`,
  )
}

export function emailField(field: string) {
  return requiredText(field, EMAIL_MAX_LENGTH).regex(
    SIMPLE_EMAIL_PATTERN,
    `${field} must be a valid email address`,
  )
}

export function contactNumberField() {
  return requiredString("contactNumber").regex(CONTACT_NUMBER_PATTERN, CONTACT_NUMBER_MESSAGE)
}

export function listedValue<const Values extends readonly [string, ...string[]]>(
  field: string,
  values: Values,
  notListedMessage: string,
) {
  return requiredString(field).pipe(z.enum(values, { error: () => notListedMessage }))
}
