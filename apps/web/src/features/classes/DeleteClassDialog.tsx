import type { SchoolClass } from "@school-portal/contract"
import { ConfirmDialog } from "../../components/ui/index.ts"
import { CLASS_DELETE_COPY as COPY, classDeleteQuestion } from "./classDeleteCopy.ts"
import { presentClassDeleteError } from "./classServerErrors.ts"
import { useDeleteClass } from "./useDeleteClass.ts"

interface DeleteClassDialogProps {
  readonly schoolClass: SchoolClass
  readonly onClose: () => void
}

export function DeleteClassDialog({ schoolClass, onClose }: DeleteClassDialogProps) {
  const deletion = useDeleteClass()
  const teacherEmail = schoolClass.formTeacher.email
  const errorMessage =
    deletion.error === null ? undefined : presentClassDeleteError(deletion.error, teacherEmail)

  return (
    <ConfirmDialog
      title={COPY.title}
      confirmLabel={COPY.confirm}
      cancelLabel={COPY.cancel}
      isConfirming={deletion.isPending}
      errorMessage={errorMessage}
      onConfirm={() => {
        deletion.mutate(teacherEmail, { onSuccess: onClose })
      }}
      onCancel={onClose}
    >
      {classDeleteQuestion(schoolClass)}
    </ConfirmDialog>
  )
}
