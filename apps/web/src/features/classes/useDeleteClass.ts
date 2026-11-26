import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteClass } from "../../api/classesApi.ts"
import { queryKeys } from "../../api/queryKeys.ts"

export function useDeleteClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteClass,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.classes }),
  })
}
