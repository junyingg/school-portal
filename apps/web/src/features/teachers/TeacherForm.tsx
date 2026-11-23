import { zodResolver } from "@hookform/resolvers/zod"
import { SUBJECTS, type CreateTeacherRequest } from "@school-portal/contract"
import { useForm } from "react-hook-form"
import { ControlledSelect } from "../../components/ControlledSelect.tsx"
import { ControlledTextInput } from "../../components/ControlledTextInput.tsx"
import { FormShell } from "../../components/FormShell.tsx"
import {
  useFocusFieldOnServerError,
  type ServerFieldError,
} from "../../hooks/useFocusFieldOnServerError.ts"
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

export type TeacherServerError = ServerFieldError<TeacherFieldName>

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
  useFocusFieldOnServerError(serverError, setFocus)

  function serverMessageFor(field: TeacherFieldName): string | undefined {
    return serverError?.field === field ? serverError.message : undefined
  }

  return (
    <FormShell
      label="Add Teacher"
      cardLabel="Teacher details"
      submitLabel="Add Teacher"
      isSubmitting={isSubmitting || formState.isSubmitting}
      bannerMessage={bannerMessage}
      onBack={onBack}
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          await onSubmit(values)
        })(event)
      }}
    >
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
    </FormShell>
  )
}
