import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../../api/queryKeys.ts"
import { fetchTeachers } from "../../api/teachersApi.ts"

export function useTeachers() {
  return useQuery({ queryKey: queryKeys.teachers, queryFn: fetchTeachers })
}
