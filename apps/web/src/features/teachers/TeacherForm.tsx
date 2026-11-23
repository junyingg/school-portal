import { zodResolver } from "@hookform/resolvers/zod"
import { SUBJECTS, type CreateTeacherRequest } from "@school-portal/contract"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { ControlledSelect } from "../../components/ControlledSelect.tsx"
import { ControlledTextInput } from "../../components/ControlledTextInput.tsx"
import { FormActions } from "../../components/FormActions.tsx"
import { Card, ErrorBanner, FormLayout } from "../../components/ui/index.ts"
import {
  TEACHER_FIELD_LABELS as LABELS,
  TEACHER_FIELD_PLACEHOLDERS as PLACEHOLDERS,
} from "./teacherFieldMessages.ts"
import {
  teacherFormSchema,
  type TeacherFieldName,
  type TeacherFormInput,
  type TeacherFormOutput,
} from "./teacherFormSchema.ts"

export interface TeacherServerError {
  readonly field: TeacherFieldName
  readonly message: string
}

export interface TeacherFormProps {
  readonly onSubmit: (values: CreateTeacherRequest) => Promise<void>
  readonly onBack: () => void
  readonly isSubmitting: boolean
  readonly serverError?: TeacherServerError | undefined
  readonly bannerMessage?: string | undefined
}

const SUBJECT_OPTIONS = SUBJECTS.map((subject) => ({ label: subject, value: subject }))

const EMPTY_TEACHER = { name: "", email: "", contactNumber: "" }

export function TeacherForm({
  onSubmit,
  onBack,
  isSubmitting,
  serverError,
  bannerMessage,
}: TeacherFormProps) {
  const { control, handleSubmit, formState, setFocus } = useForm<
    TeacherFormInput,
    unknown,
    TeacherFormOutput
  >({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: EMPTY_TEACHER,
  })

  const serverErrorField = serverError?.field
  const serverErrorMessage = serverError?.message
  useEffect(() => {
    if (serverErrorField !== undefined) {
      setFocus(serverErrorField)
    }
  }, [serverErrorField, serverErrorMessage, setFocus])

  function serverMessageFor(field: TeacherFieldName): string | undefined {
    return serverError?.field === field ? serverError.message : undefined
  }

  return (
    <FormLayout
      label="Add Teacher"
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          await onSubmit(values)
        })(event)
      }}
    >
      <Card label="Teacher details">
        <ControlledTextInput
          control={control}
          name="name"
          label={LABELS.name}
          placeholder={PLACEHOLDERS.name}
          serverMessage={serverMessageFor("name")}
        />
        <ControlledSelect
          control={control}
          name="subject"
          label={LABELS.subject}
          placeholder={PLACEHOLDERS.subject}
          options={SUBJECT_OPTIONS}
          serverMessage={serverMessageFor("subject")}
        />
        <ControlledTextInput
          control={control}
          name="email"
          label={LABELS.email}
          placeholder={PLACEHOLDERS.email}
          serverMessage={serverMessageFor("email")}
        />
        <ControlledTextInput
          control={control}
          name="contactNumber"
          label={LABELS.contactNumber}
          placeholder={PLACEHOLDERS.contactNumber}
          serverMessage={serverMessageFor("contactNumber")}
        />
      </Card>
      {bannerMessage === undefined ? null : <ErrorBanner message={bannerMessage} />}
      <FormActions
        submitLabel="Add Teacher"
        isSubmitting={isSubmitting || formState.isSubmitting}
        onBack={onBack}
      />
    </FormLayout>
  )
}
