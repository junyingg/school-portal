import type { CreateTeacherRequest } from "@school-portal/contract"
import { useNavigate } from "react-router"
import { PageHeader } from "../components/PageHeader.tsx"
import { presentTeacherServerError } from "../features/teachers/teacherServerErrors.ts"
import { TeacherForm } from "../features/teachers/TeacherForm.tsx"
import { useCreateTeacher } from "../features/teachers/useCreateTeacher.ts"
import { ROUTES } from "../routePaths.ts"

export function AddTeacherPage() {
  const navigate = useNavigate()
  const createTeacher = useCreateTeacher()

  const goToTeachers = () => {
    void navigate(ROUTES.teachers)
  }

  const submit = async (values: CreateTeacherRequest) => {
    const wasCreated = await createTeacher.mutateAsync(values).then(
      () => true,
      () => false,
    )
    if (wasCreated) {
      goToTeachers()
    }
  }

  const serverError =
    createTeacher.error === null ? undefined : presentTeacherServerError(createTeacher.error)

  return (
    <>
      <PageHeader title="Add Teacher" />
      <TeacherForm
        onSubmit={submit}
        onBack={goToTeachers}
        isSubmitting={createTeacher.isPending}
        serverError={serverError?.kind === "field" ? serverError : undefined}
        bannerMessage={serverError?.kind === "banner" ? serverError.message : undefined}
      />
    </>
  )
}
