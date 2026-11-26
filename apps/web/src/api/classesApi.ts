import {
  classListResponseSchema,
  schoolClassSchema,
  type CreateClassRequest,
  type SchoolClass,
} from "@school-portal/contract"
import { deleteResource, getJson, postJson } from "./apiClient.ts"

export const CLASSES_PATH = "/api/classes"

export async function fetchClasses(): Promise<SchoolClass[]> {
  const response = await getJson(CLASSES_PATH, classListResponseSchema)
  return response.data
}

export function createClass(request: CreateClassRequest): Promise<SchoolClass> {
  return postJson(CLASSES_PATH, request, schoolClassSchema)
}

export function deleteClass(teacherEmail: string): Promise<void> {
  return deleteResource(`${CLASSES_PATH}/${encodeURIComponent(teacherEmail)}`)
}
