import { CLASS_LEVELS, CLASS_NAME_MAX_LENGTH } from "@school-portal/contract"
import { z } from "zod"
import { isUnselected } from "../selectionRules.ts"
import { CLASS_FIELD_MESSAGES as MESSAGES } from "./classFieldMessages.ts"

export const classFormSchema = z.object({
  level: z.enum(CLASS_LEVELS, {
    error: (issue) => (isUnselected(issue.input) ? MESSAGES.levelRequired : MESSAGES.levelInvalid),
  }),
  name: z
    .string()
    .trim()
    .min(1, { error: MESSAGES.nameRequired, abort: true })
    .max(CLASS_NAME_MAX_LENGTH, MESSAGES.nameTooLong),
  teacherEmail: z
    .string({ error: MESSAGES.formTeacherRequired })
    .min(1, MESSAGES.formTeacherRequired),
})

export type ClassFormInput = z.input<typeof classFormSchema>
export type ClassFormOutput = z.output<typeof classFormSchema>
export type ClassFieldName = keyof ClassFormInput
