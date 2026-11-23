import { teacherListResponseSchema, type Teacher } from "@school-portal/contract"
import { getJson } from "./apiClient.ts"

export const TEACHERS_PATH = "/api/teachers"

export async function fetchTeachers(): Promise<Teacher[]> {
  const response = await getJson(TEACHERS_PATH, teacherListResponseSchema)
  return response.data
}
