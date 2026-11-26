import { z } from "zod"
import {
  SUBJECT_NOT_LISTED_MESSAGE,
  contactNumberField,
  emailField,
  listedValue,
  personName,
} from "./fieldRules.ts"
import { SUBJECTS } from "./optionLists.ts"

export const createTeacherRequestSchema = z.object({
  name: personName("name"),
  subject: listedValue("subject", SUBJECTS, SUBJECT_NOT_LISTED_MESSAGE),
  email: emailField("email"),
  contactNumber: contactNumberField(),
})

export const teacherPathParamsSchema = z.object({
  email: emailField("email"),
})

export const teacherSchema = z.object({
  name: z.string(),
  subject: z.string(),
  email: z.string(),
  contactNumber: z.string(),
})

export const teacherListResponseSchema = z.object({
  data: z.array(teacherSchema),
})

export type CreateTeacherRequest = z.output<typeof createTeacherRequestSchema>
export type TeacherPathParams = z.output<typeof teacherPathParamsSchema>
export type Teacher = z.output<typeof teacherSchema>
export type TeacherListResponse = z.output<typeof teacherListResponseSchema>
