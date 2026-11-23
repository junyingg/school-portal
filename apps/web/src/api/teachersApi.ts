import {
  teacherListResponseSchema,
  teacherSchema,
  type CreateTeacherRequest,
  type Teacher,
} from "@school-portal/contract"
import { getJson, postJson } from "./apiClient.ts"

export const TEACHERS_PATH = "/api/teachers"

export async function fetchTeachers(): Promise<Teacher[]> {
  const response = await getJson(TEACHERS_PATH, teacherListResponseSchema)
  return response.data
}

export function createTeacher(request: CreateTeacherRequest): Promise<Teacher> {
  return postJson(TEACHERS_PATH, request, teacherSchema)
}
