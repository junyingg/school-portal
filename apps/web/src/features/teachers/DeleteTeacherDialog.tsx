import type { Teacher } from "@school-portal/contract"
import { ConfirmDialog } from "../../components/ui/index.ts"
import { TEACHER_DELETE_COPY as COPY, teacherDeleteQuestion } from "./teacherDeleteCopy.ts"
import { presentTeacherDeleteError } from "./teacherServerErrors.ts"
import { useDeleteTeacher } from "./useDeleteTeacher.ts"

interface DeleteTeacherDialogProps {
  readonly teacher: Teacher
  readonly onClose: () => void
}

export function DeleteTeacherDialog({ teacher, onClose }: DeleteTeacherDialogProps) {
  const deletion = useDeleteTeacher()
  const errorMessage =
    deletion.error === null ? undefined : presentTeacherDeleteError(deletion.error, teacher.email)

  return (
    <ConfirmDialog
      title={COPY.title}
      confirmLabel={COPY.confirm}
      cancelLabel={COPY.cancel}
      isConfirming={deletion.isPending}
      errorMessage={errorMessage}
      onConfirm={() => {
        deletion.mutate(teacher.email, { onSuccess: onClose })
      }}
      onCancel={onClose}
    >
      {teacherDeleteQuestion(teacher)}
    </ConfirmDialog>
  )
}
