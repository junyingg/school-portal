import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../../api/queryKeys.ts"
import { createTeacher } from "../../api/teachersApi.ts"

export function useCreateTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  })
}
