import { zodResolver } from "@hookform/resolvers/zod"
import { CLASS_LEVELS, type CreateClassRequest } from "@school-portal/contract"
import { useForm } from "react-hook-form"
import { ControlledSelect } from "../../components/ControlledSelect.tsx"
import { ControlledTextInput } from "../../components/ControlledTextInput.tsx"
import { FormShell } from "../../components/FormShell.tsx"
import {
  useFocusFieldOnServerError,
  type ServerFieldError,
} from "../../hooks/useFocusFieldOnServerError.ts"
import {
  CLASS_FIELD_LABELS as LABELS,
  CLASS_FIELD_PLACEHOLDERS as PLACEHOLDERS,
} from "./classFieldMessages.ts"
import {
  classFormSchema,
  type ClassFieldName,
  type ClassFormInput,
  type ClassFormOutput,
} from "./classFormSchema.ts"
import { FormTeacherSelect } from "./FormTeacherSelect.tsx"

export type ClassServerError = ServerFieldError<ClassFieldName>

export interface ClassFormProps {
  readonly onSubmit: (values: CreateClassRequest) => Promise<void>
  readonly onBack: () => void
  readonly isSubmitting: boolean
  readonly serverError?: ClassServerError | undefined
  readonly bannerMessage?: string | undefined
}

const LEVEL_OPTIONS = CLASS_LEVELS.map((level) => ({ label: level, value: level }))

const EMPTY_CLASS = { name: "" }

export function ClassForm({
  onSubmit,
  onBack,
  isSubmitting,
  serverError,
  bannerMessage,
}: ClassFormProps) {
  const { control, handleSubmit, formState, setFocus } = useForm<
    ClassFormInput,
    unknown,
    ClassFormOutput
  >({
    resolver: zodResolver(classFormSchema),
    defaultValues: EMPTY_CLASS,
  })
  useFocusFieldOnServerError(serverError, setFocus)

  function serverMessageFor(field: ClassFieldName): string | undefined {
    return serverError?.field === field ? serverError.message : undefined
  }

  return (
    <FormShell
      label="Add Class"
      cardLabel="Class details"
      submitLabel="Add Class"
      isSubmitting={isSubmitting || formState.isSubmitting}
      bannerMessage={bannerMessage}
      onBack={onBack}
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          await onSubmit(values)
        })(event)
      }}
    >
      <ControlledSelect
        control={control}
        name="level"
        label={LABELS.level}
        placeholder={PLACEHOLDERS.level}
        options={LEVEL_OPTIONS}
        serverMessage={serverMessageFor("level")}
      />
      <ControlledTextInput
        control={control}
        name="name"
        label={LABELS.name}
        placeholder={PLACEHOLDERS.name}
        serverMessage={serverMessageFor("name")}
      />
      <FormTeacherSelect
        control={control}
        name="teacherEmail"
        serverMessage={serverMessageFor("teacherEmail")}
      />
    </FormShell>
  )
}
