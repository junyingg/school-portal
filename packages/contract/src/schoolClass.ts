import { z } from "zod"
import {
  CLASS_LEVEL_MAX_LENGTH,
  CLASS_NAME_MAX_LENGTH,
  emailField,
  requiredText,
} from "./fieldRules.ts"

export const createClassRequestSchema = z.object({
  level: requiredText("level", CLASS_LEVEL_MAX_LENGTH),
  name: requiredText("name", CLASS_NAME_MAX_LENGTH),
  teacherEmail: emailField("teacherEmail"),
})

export const formTeacherSchema = z.object({
  name: z.string(),
})

export const schoolClassSchema = z.object({
  level: z.string(),
  name: z.string(),
  formTeacher: formTeacherSchema,
})

export const classListResponseSchema = z.object({
  data: z.array(schoolClassSchema),
})

export type CreateClassRequest = z.output<typeof createClassRequestSchema>
export type FormTeacher = z.output<typeof formTeacherSchema>
export type SchoolClass = z.output<typeof schoolClassSchema>
export type ClassListResponse = z.output<typeof classListResponseSchema>
