import type { Teacher } from "@school-portal/contract"
import type { SelectOption } from "../../components/ui/index.ts"

function namesSharedByMoreThanOneTeacher(teachers: readonly Teacher[]): Set<string> {
  const seenNames = new Set<string>()
  const sharedNames = new Set<string>()
  for (const teacher of teachers) {
    if (seenNames.has(teacher.name)) {
      sharedNames.add(teacher.name)
    }
    seenNames.add(teacher.name)
  }
  return sharedNames
}

export function teacherOptions(teachers: readonly Teacher[]): SelectOption[] {
  const sharedNames = namesSharedByMoreThanOneTeacher(teachers)
  return teachers.map((teacher) => ({
    label: sharedNames.has(teacher.name) ? `${teacher.name} (${teacher.email})` : teacher.name,
    value: teacher.email,
  }))
}
