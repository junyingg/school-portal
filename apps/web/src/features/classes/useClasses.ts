import { useQuery } from "@tanstack/react-query"
import { fetchClasses } from "../../api/classesApi.ts"
import { queryKeys } from "../../api/queryKeys.ts"

export function useClasses() {
  return useQuery({ queryKey: queryKeys.classes, queryFn: fetchClasses })
}
