import { SPEC_CLASSES, SPEC_CREATE_CLASS_REQUEST, SPEC_TEACHERS } from "@school-portal/contract"
import { describe, expect, it, vi } from "vitest"
import { UnknownTeacherEmailError } from "../../errors/domainErrors.ts"
import type { TeacherRecord, TeacherRepository } from "../teachers/teacherRepository.ts"
import type { ClassRepository, ClassWithFormTeacherRecord } from "./classRepository.ts"
import { createClassService } from "./classService.ts"

const [MARY] = SPEC_TEACHERS
const MARY_RECORD: TeacherRecord = { id: 7, ...MARY }
const CLASS_1A_WITH_UPPER_CASE_EMAIL = {
  ...SPEC_CREATE_CLASS_REQUEST,
  teacherEmail: "TEACHERMARY@GMAIL.COM",
}

function fakeTeacherRepository(findByEmail: TeacherRepository["findByEmail"]): TeacherRepository {
  return {
    insert: () => Promise.reject(new Error("insert not expected")),
    listInInsertionOrder: () => Promise.resolve([]),
    findByEmail,
  }
}

function fakeClassRepository(
  insert: ClassRepository["insert"],
  listInInsertionOrder: ClassRepository["listInInsertionOrder"] = () => Promise.resolve([]),
): ClassRepository {
  return { insert, listInInsertionOrder }
}

const [CLASS_1A, CLASS_2B] = SPEC_CLASSES

describe("addClass", () => {
  it("inserts the class for the teacher found by email and returns only the teacher name", async () => {
    const findByEmail = vi.fn<TeacherRepository["findByEmail"]>().mockResolvedValue(MARY_RECORD)
    const insert = vi.fn<ClassRepository["insert"]>().mockResolvedValue()
    const service = createClassService({
      teacherRepository: fakeTeacherRepository(findByEmail),
      classRepository: fakeClassRepository(insert),
    })

    await expect(service.addClass(CLASS_1A_WITH_UPPER_CASE_EMAIL)).resolves.toStrictEqual({
      level: "Primary 1",
      name: "Class 1A",
      formTeacher: { name: "Mary" },
    })
    expect(findByEmail).toHaveBeenCalledExactlyOnceWith("TEACHERMARY@GMAIL.COM")
    expect(insert).toHaveBeenCalledExactlyOnceWith({
      level: "Primary 1",
      name: "Class 1A",
      formTeacherId: 7,
    })
  })

  it("rejects an unknown teacher email without inserting", async () => {
    const insert = vi.fn<ClassRepository["insert"]>()
    const service = createClassService({
      teacherRepository: fakeTeacherRepository(() => Promise.resolve(undefined)),
      classRepository: fakeClassRepository(insert),
    })

    const addition = service.addClass({ ...SPEC_CREATE_CLASS_REQUEST, teacherEmail: "x@y.co" })

    await expect(addition).rejects.toBeInstanceOf(UnknownTeacherEmailError)
    await expect(addition).rejects.toMatchObject({ message: "No teacher found with email x@y.co" })
    expect(insert).not.toHaveBeenCalled()
  })

  it("propagates the insert error unchanged", async () => {
    const uniqueViolation = Object.assign(new Error("duplicate key"), { code: "23505" })
    const service = createClassService({
      teacherRepository: fakeTeacherRepository(() => Promise.resolve(MARY_RECORD)),
      classRepository: fakeClassRepository(() => Promise.reject(uniqueViolation)),
    })

    await expect(service.addClass(SPEC_CREATE_CLASS_REQUEST)).rejects.toBe(uniqueViolation)
  })
})

describe("listClasses", () => {
  it("keeps the repository order", async () => {
    const records: ClassWithFormTeacherRecord[] = [
      { level: "Primary 2", name: "Class 2B", formTeacherName: "Ken" },
      { level: "Primary 1", name: "Class 1A", formTeacherName: "Mary" },
    ]
    const service = createClassService({
      teacherRepository: fakeTeacherRepository(() => Promise.resolve(undefined)),
      classRepository: fakeClassRepository(
        () => Promise.resolve(),
        () => Promise.resolve(records),
      ),
    })

    await expect(service.listClasses()).resolves.toStrictEqual([CLASS_2B, CLASS_1A])
  })
})
