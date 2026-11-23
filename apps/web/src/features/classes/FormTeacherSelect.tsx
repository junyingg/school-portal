import { useState } from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { Link } from "react-router"
import { ControlledSelect } from "../../components/ControlledSelect.tsx"
import { Button } from "../../components/ui/index.ts"
import { ROUTES } from "../../routePaths.ts"
import { useTeachers } from "../teachers/useTeachers.ts"
import {
  CLASS_FIELD_LABELS,
  CLASS_FIELD_PLACEHOLDERS,
  FORM_TEACHER_COPY,
} from "./classFieldMessages.ts"
import styles from "./FormTeacherSelect.module.css"
import { teacherOptions } from "./teacherOptions.ts"

interface NoTeachersMessageProps {
  readonly className: string | undefined
}

function NoTeachersMessage({ className }: NoTeachersMessageProps) {
  return (
    <div className={className}>
      <span>{FORM_TEACHER_COPY.noTeachers}</span>
      <Link to={ROUTES.newTeacher}>{FORM_TEACHER_COPY.addTeacher}</Link>
    </div>
  )
}

interface LoadFailureNoteProps {
  readonly onRetry: () => void
}

function LoadFailureNote({ onRetry }: LoadFailureNoteProps) {
  return (
    <div className={styles["note"]}>
      <span>{FORM_TEACHER_COPY.loadFailed}</span>
      <Button variant="outlined" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

interface FormTeacherSelectProps<Values extends FieldValues, Output> {
  readonly control: Control<Values, unknown, Output>
  readonly name: FieldPath<Values>
  readonly serverMessage?: string | undefined
}

export function FormTeacherSelect<Values extends FieldValues, Output>({
  control,
  name,
  serverMessage,
}: FormTeacherSelectProps<Values, Output>) {
  const teachers = useTeachers()
  const [isOpen, setIsOpen] = useState(false)
  const hasNoTeachers = teachers.isSuccess && teachers.data.length === 0
  const options = teachers.isSuccess ? teacherOptions(teachers.data) : []

  function footnote() {
    if (teachers.isError) {
      return (
        <LoadFailureNote
          onRetry={() => {
            void teachers.refetch()
          }}
        />
      )
    }
    if (hasNoTeachers && !isOpen) {
      return <NoTeachersMessage className={styles["note"]} />
    }
    return undefined
  }

  return (
    <ControlledSelect
      control={control}
      name={name}
      label={CLASS_FIELD_LABELS.teacherEmail}
      placeholder={CLASS_FIELD_PLACEHOLDERS.teacherEmail}
      options={options}
      serverMessage={serverMessage}
      isLoading={teachers.isPending}
      emptyContent={
        hasNoTeachers && isOpen ? <NoTeachersMessage className={styles["panel"]} /> : undefined
      }
      footnote={footnote()}
      onOpenChange={setIsOpen}
    />
  )
}
