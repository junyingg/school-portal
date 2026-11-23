import { SPEC_TEACHERS } from "@school-portal/contract"
import { describe, expect, it, vi } from "vitest"
import type { TeacherRecord, TeacherRepository } from "./teacherRepository.ts"
import { createTeacherService } from "./teacherService.ts"

const [MARY, KEN] = SPEC_TEACHERS
const MARY_RECORD: TeacherRecord = { id: 1, ...MARY }
const KEN_RECORD: TeacherRecord = { id: 2, ...KEN }

function fakeRepository(overrides: Partial<TeacherRepository> = {}): TeacherRepository {
  return {
    insert: () => Promise.reject(new Error("insert not expected")),
    listInInsertionOrder: () => Promise.resolve([]),
    findByEmail: () => Promise.resolve(undefined),
    ...overrides,
  }
}

function serviceWith(overrides: Partial<TeacherRepository>) {
  return createTeacherService({ teacherRepository: fakeRepository(overrides) })
}

describe("registerTeacher", () => {
  it("inserts the request and returns the teacher without its id", async () => {
    const insert = vi.fn<TeacherRepository["insert"]>().mockResolvedValue(MARY_RECORD)

    await expect(serviceWith({ insert }).registerTeacher(MARY)).resolves.toStrictEqual(MARY)
    expect(insert).toHaveBeenCalledExactlyOnceWith(MARY)
  })

  it("propagates the repository error unchanged", async () => {
    const uniqueViolation = Object.assign(new Error("duplicate key"), { code: "23505" })
    const insert = vi.fn<TeacherRepository["insert"]>().mockRejectedValue(uniqueViolation)

    await expect(serviceWith({ insert }).registerTeacher(MARY)).rejects.toBe(uniqueViolation)
  })
})

describe("listTeachers", () => {
  it("keeps the repository order and drops ids", async () => {
    const listInInsertionOrder = () => Promise.resolve([MARY_RECORD, KEN_RECORD])

    await expect(serviceWith({ listInInsertionOrder }).listTeachers()).resolves.toStrictEqual([
      MARY,
      KEN,
    ])
  })

  it("returns an empty list when there are no teachers", async () => {
    await expect(serviceWith({}).listTeachers()).resolves.toStrictEqual([])
  })
})
