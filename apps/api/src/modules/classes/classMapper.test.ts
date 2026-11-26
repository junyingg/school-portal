import { describe, expect, it } from "vitest"
import { toSchoolClass } from "./classMapper.ts"

describe("toSchoolClass", () => {
  it("nests the form teacher's name and email in key order", () => {
    const record = {
      formTeacherEmail: "teachermary@gmail.com",
      formTeacherName: "Mary",
      name: "Class 1A",
      level: "Primary 1",
    }

    expect(JSON.stringify(toSchoolClass(record))).toBe(
      '{"level":"Primary 1","name":"Class 1A","formTeacher":{"name":"Mary","email":"teachermary@gmail.com"}}',
    )
  })
})
