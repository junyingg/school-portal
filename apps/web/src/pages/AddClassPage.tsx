import { PageHeader } from "../components/PageHeader.tsx"
import { clearClassDraft } from "../features/classes/classDraft.ts"
import { ClassForm } from "../features/classes/ClassForm.tsx"
import { presentClassServerError } from "../features/classes/classServerErrors.ts"
import type { ClassFieldName } from "../features/classes/classFormSchema.ts"
import { useCreateClass } from "../features/classes/useCreateClass.ts"
import { useSubmitThenReturn } from "../hooks/useSubmitThenReturn.ts"
import { ROUTES } from "../routePaths.ts"

export function AddClassPage() {
  const createClass = useCreateClass()
  const { submit, goBack } = useSubmitThenReturn(
    createClass.mutateAsync,
    ROUTES.classes,
    clearClassDraft,
  )
  const serverError =
    createClass.error === null
      ? undefined
      : presentClassServerError(createClass.error, createClass.variables?.teacherEmail)

  function clearFieldError(field: ClassFieldName) {
    if (createClass.isPending) {
      return
    }
    if (serverError?.kind === "field" && serverError.field === field) {
      createClass.reset()
    }
  }

  function handleBack() {
    clearClassDraft()
    goBack()
  }

  return (
    <>
      <PageHeader title="Add Class" />
      <ClassForm
        onSubmit={submit}
        onBack={handleBack}
        isSubmitting={createClass.isPending}
        serverError={serverError?.kind === "field" ? serverError : undefined}
        bannerMessage={serverError?.kind === "banner" ? serverError.message : undefined}
        onEdit={clearFieldError}
      />
    </>
  )
}
