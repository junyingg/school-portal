import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../../api/queryKeys.ts"
import { deleteTeacher } from "../../api/teachersApi.ts"

export function useDeleteTeacher() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTeacher,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  })
}
