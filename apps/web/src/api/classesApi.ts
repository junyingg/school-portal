import { classListResponseSchema, type SchoolClass } from "@school-portal/contract"
import { getJson } from "./apiClient.ts"

export const CLASSES_PATH = "/api/classes"

export async function fetchClasses(): Promise<SchoolClass[]> {
  const response = await getJson(CLASSES_PATH, classListResponseSchema)
  return response.data
}
