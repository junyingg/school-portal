import { zodResolver } from "@hookform/resolvers/zod"
import { CLASS_LEVELS, type CreateClassRequest } from "@school-portal/contract"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { ControlledSelect } from "../../components/ControlledSelect.tsx"
import { ControlledTextInput } from "../../components/ControlledTextInput.tsx"
import { FormShell } from "../../components/FormShell.tsx"
import {
  useFocusFieldOnServerError,
  type ServerFieldError,
} from "../../hooks/useFocusFieldOnServerError.ts"
import { readClassDraft, writeClassDraft } from "./classDraft.ts"
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
  readonly onEdit?: ((field: ClassFieldName) => void) | undefined
}

const LEVEL_OPTIONS = CLASS_LEVELS.map((level) => ({ label: level, value: level }))

const EMPTY_CLASS = { name: "" }

export function ClassForm({
  onSubmit,
  onBack,
  isSubmitting,
  serverError,
  bannerMessage,
  onEdit,
}: ClassFormProps) {
  const [initialValues] = useState<Partial<ClassFormInput>>(() => ({
    ...EMPTY_CLASS,
    ...readClassDraft(),
  }))
  const { control, handleSubmit, formState, setFocus, watch } = useForm<
    ClassFormInput,
    unknown,
    ClassFormOutput
  >({
    resolver: zodResolver(classFormSchema),
    defaultValues: initialValues,
  })
  useFocusFieldOnServerError(serverError, setFocus)

  useEffect(() => {
    // react-hook-form's watch() subscription is intentionally used to persist drafts.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch((values) => {
      writeClassDraft(values)
    })
    return () => subscription.unsubscribe()
  }, [watch])

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
        onEdit={() => onEdit?.("level")}
      />
      <ControlledTextInput
        control={control}
        name="name"
        label={LABELS.name}
        placeholder={PLACEHOLDERS.name}
        serverMessage={serverMessageFor("name")}
        onEdit={() => onEdit?.("name")}
      />
      <FormTeacherSelect
        control={control}
        name="teacherEmail"
        serverMessage={serverMessageFor("teacherEmail")}
        onEdit={() => onEdit?.("teacherEmail")}
      />
    </FormShell>
  )
}
