import { z } from "zod"
import {
  SUBJECT_MAX_LENGTH,
  contactNumberField,
  emailField,
  personName,
  requiredText,
} from "./fieldRules.ts"

export const createTeacherRequestSchema = z.object({
  name: personName("name"),
  subject: requiredText("subject", SUBJECT_MAX_LENGTH),
  email: emailField("email"),
  contactNumber: contactNumberField(),
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
export type Teacher = z.output<typeof teacherSchema>
export type TeacherListResponse = z.output<typeof teacherListResponseSchema>
