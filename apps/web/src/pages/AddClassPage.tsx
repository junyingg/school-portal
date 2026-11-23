import { PageHeader } from "../components/PageHeader.tsx"
import { ClassForm } from "../features/classes/ClassForm.tsx"
import { useCreateClass } from "../features/classes/useCreateClass.ts"
import { useSubmitThenReturn } from "../hooks/useSubmitThenReturn.ts"
import { ROUTES } from "../routePaths.ts"

export function AddClassPage() {
  const createClass = useCreateClass()
  const { submit, goBack } = useSubmitThenReturn(createClass.mutateAsync, ROUTES.classes)

  return (
    <>
      <PageHeader title="Add Class" />
      <ClassForm onSubmit={submit} onBack={goBack} isSubmitting={createClass.isPending} />
    </>
  )
}
