import {
  CONTROL_CHARACTER_PATTERN,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  SIMPLE_EMAIL_PATTERN,
  SUBJECTS,
} from "@school-portal/contract"
import { z } from "zod"
import { TEACHER_FIELD_MESSAGES as MESSAGES } from "./teacherFieldMessages.ts"

export const WORK_CONTACT_NUMBER_PATTERN = /^6\d{7}$/
const ALL_WHITESPACE = /\s+/g

function isUnselected(input: unknown): boolean {
  return input === undefined || input === ""
}

function stripWhitespace(value: string): string {
  return value.replace(ALL_WHITESPACE, "")
}

export const teacherFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: MESSAGES.nameRequired, abort: true })
    .max(NAME_MAX_LENGTH, MESSAGES.nameTooLong)
    .refine((value) => !CONTROL_CHARACTER_PATTERN.test(value), MESSAGES.nameHasControlCharacters),
  subject: z.enum(SUBJECTS, {
    error: (issue) =>
      isUnselected(issue.input) ? MESSAGES.subjectRequired : MESSAGES.subjectInvalid,
  }),
  email: z
    .string()
    .trim()
    .min(1, { error: MESSAGES.emailRequired, abort: true })
    .max(EMAIL_MAX_LENGTH, { error: MESSAGES.emailTooLong, abort: true })
    .regex(SIMPLE_EMAIL_PATTERN, MESSAGES.emailInvalid),
  contactNumber: z
    .string()
    .transform(stripWhitespace)
    .pipe(
      z
        .string()
        .min(1, { error: MESSAGES.contactNumberRequired, abort: true })
        .regex(WORK_CONTACT_NUMBER_PATTERN, MESSAGES.contactNumberInvalid),
    ),
})

export type TeacherFormInput = z.input<typeof teacherFormSchema>
export type TeacherFormOutput = z.output<typeof teacherFormSchema>
export type TeacherFieldName = keyof TeacherFormInput
