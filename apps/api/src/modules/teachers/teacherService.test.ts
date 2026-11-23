import { SPEC_TEACHERS } from "@school-portal/contract"
import { describe, expect, it, vi } from "vitest"
import type { TeacherRecord, TeacherRepository } from "./teacherRepository.ts"
import { createTeacherService } from "./teacherService.ts"

const [MARY] = SPEC_TEACHERS
const MARY_RECORD: TeacherRecord = { id: 1, ...MARY }

function serviceWith(insert: TeacherRepository["insert"]) {
  return createTeacherService({ teacherRepository: { insert } })
}

describe("registerTeacher", () => {
  it("inserts the request and returns the teacher without its id", async () => {
    const insert = vi.fn<TeacherRepository["insert"]>().mockResolvedValue(MARY_RECORD)

    await expect(serviceWith(insert).registerTeacher(MARY)).resolves.toStrictEqual(MARY)
    expect(insert).toHaveBeenCalledExactlyOnceWith(MARY)
  })

  it("propagates the repository error unchanged", async () => {
    const uniqueViolation = Object.assign(new Error("duplicate key"), { code: "23505" })
    const insert = vi.fn<TeacherRepository["insert"]>().mockRejectedValue(uniqueViolation)

    await expect(serviceWith(insert).registerTeacher(MARY)).rejects.toBe(uniqueViolation)
  })
})
