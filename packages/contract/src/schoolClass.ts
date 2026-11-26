import { z } from "zod"
import {
  CLASS_NAME_MAX_LENGTH,
  LEVEL_NOT_LISTED_MESSAGE,
  emailField,
  listedValue,
  requiredText,
} from "./fieldRules.ts"
import { CLASS_LEVELS } from "./optionLists.ts"

export const createClassRequestSchema = z.object({
  level: listedValue("level", CLASS_LEVELS, LEVEL_NOT_LISTED_MESSAGE),
  name: requiredText("name", CLASS_NAME_MAX_LENGTH),
  teacherEmail: emailField("teacherEmail"),
})

export const formTeacherSchema = z.object({
  name: z.string(),
  email: z.string(),
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
