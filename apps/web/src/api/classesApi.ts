import {
  classListResponseSchema,
  schoolClassSchema,
  type CreateClassRequest,
  type SchoolClass,
} from "@school-portal/contract"
import { getJson, postJson } from "./apiClient.ts"

export const CLASSES_PATH = "/api/classes"

export async function fetchClasses(): Promise<SchoolClass[]> {
  const response = await getJson(CLASSES_PATH, classListResponseSchema)
  return response.data
}

export function createClass(request: CreateClassRequest): Promise<SchoolClass> {
  return postJson(CLASSES_PATH, request, schoolClassSchema)
}
