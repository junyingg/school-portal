import { PageHeader } from "../components/PageHeader.tsx"
import { presentTeacherServerError } from "../features/teachers/teacherServerErrors.ts"
import { TeacherForm } from "../features/teachers/TeacherForm.tsx"
import { useCreateTeacher } from "../features/teachers/useCreateTeacher.ts"
import { useSubmitThenReturn } from "../hooks/useSubmitThenReturn.ts"
import { ROUTES } from "../routePaths.ts"

export function AddTeacherPage() {
  const createTeacher = useCreateTeacher()
  const { submit, goBack } = useSubmitThenReturn(createTeacher.mutateAsync, ROUTES.teachers)
  const serverError =
    createTeacher.error === null ? undefined : presentTeacherServerError(createTeacher.error)

  return (
    <>
      <PageHeader title="Add Teacher" />
      <TeacherForm
        onSubmit={submit}
        onBack={goBack}
        isSubmitting={createTeacher.isPending}
        serverError={serverError?.kind === "field" ? serverError : undefined}
        bannerMessage={serverError?.kind === "banner" ? serverError.message : undefined}
      />
    </>
  )
}
