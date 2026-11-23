import { useNavigate } from "react-router"
import { EmptyState } from "../components/EmptyState.tsx"
import { LoadErrorState } from "../components/LoadErrorState.tsx"
import { PageHeader } from "../components/PageHeader.tsx"
import { AddIcon, Button, Card, LoadingState } from "../components/ui/index.ts"
import { TeacherTable } from "../features/teachers/TeacherTable.tsx"
import { useTeachers } from "../features/teachers/useTeachers.ts"
import { ROUTES } from "../routePaths.ts"

const EMPTY_MESSAGE = "There are no existing teachers yet."
const LOAD_ERROR_MESSAGE = "We could not load the teachers."

interface AddTeacherButtonProps {
  readonly onClick: () => void
}

function AddTeacherButton({ onClick }: AddTeacherButtonProps) {
  return (
    <Button icon={<AddIcon />} onClick={onClick}>
      Add Teacher
    </Button>
  )
}

export function TeachersPage() {
  const teachers = useTeachers()
  const navigate = useNavigate()
  const openAddTeacher = () => {
    void navigate(ROUTES.newTeacher)
  }
  const hasTeachers = teachers.isSuccess && teachers.data.length > 0

  function renderCardContent() {
    if (teachers.isPending) {
      return <LoadingState message="Loading teachers…" />
    }
    if (teachers.isError) {
      return (
        <LoadErrorState
          message={LOAD_ERROR_MESSAGE}
          onRetry={() => {
            void teachers.refetch()
          }}
        />
      )
    }
    if (teachers.data.length === 0) {
      return (
        <EmptyState
          message={EMPTY_MESSAGE}
          action={<AddTeacherButton onClick={openAddTeacher} />}
        />
      )
    }
    return <TeacherTable teachers={teachers.data} />
  }

  return (
    <>
      <PageHeader
        title="Teachers"
        action={hasTeachers ? <AddTeacherButton onClick={openAddTeacher} /> : undefined}
      />
      <Card label="Teachers" isBusy={teachers.isPending}>
        {renderCardContent()}
      </Card>
    </>
  )
}
