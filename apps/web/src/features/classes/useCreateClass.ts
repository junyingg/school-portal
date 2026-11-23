import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createClass } from "../../api/classesApi.ts"
import { queryKeys } from "../../api/queryKeys.ts"

export function useCreateClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClass,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.classes }),
  })
}
