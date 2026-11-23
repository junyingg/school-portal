import { useLocation } from "react-router"
import { PageHeader } from "../components/PageHeader.tsx"
import { presentTeacherServerError } from "../features/teachers/teacherServerErrors.ts"
import { TeacherForm } from "../features/teachers/TeacherForm.tsx"
import type { TeacherFieldName } from "../features/teachers/teacherFormSchema.ts"
import { useCreateTeacher } from "../features/teachers/useCreateTeacher.ts"
import { useSubmitThenReturn } from "../hooks/useSubmitThenReturn.ts"
import { ROUTES } from "../routePaths.ts"

function returnPathFrom(state: unknown): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "returnTo" in state &&
    state.returnTo === ROUTES.newClass
  ) {
    return ROUTES.newClass
  }
  return ROUTES.teachers
}

export function AddTeacherPage() {
  const location = useLocation()
  const createTeacher = useCreateTeacher()
  const returnTo = returnPathFrom(location.state)
  const { submit, goBack } = useSubmitThenReturn(createTeacher.mutateAsync, returnTo)
  const serverError =
    createTeacher.error === null ? undefined : presentTeacherServerError(createTeacher.error)

  function clearFieldError(field: TeacherFieldName) {
    if (createTeacher.isPending) {
      return
    }
    if (serverError?.kind === "field" && serverError.field === field) {
      createTeacher.reset()
    }
  }

  return (
    <>
      <PageHeader title="Add Teacher" />
      <TeacherForm
        onSubmit={submit}
        onBack={goBack}
        isSubmitting={createTeacher.isPending}
        serverError={serverError?.kind === "field" ? serverError : undefined}
        bannerMessage={serverError?.kind === "banner" ? serverError.message : undefined}
        onEdit={clearFieldError}
      />
    </>
  )
}
