import { describe, expect, it } from "vitest"
import { designTeachers } from "../../test/designFixtures.ts"
import { teacherOptions } from "./teacherOptions.ts"

describe("teacherOptions", () => {
  it("labels each teacher by name and uses the email as the value, in order", () => {
    expect(teacherOptions(designTeachers)).toEqual(
      designTeachers.map((teacher) => ({ label: teacher.name, value: teacher.email })),
    )
  })

  it("returns no options for no teachers", () => {
    expect(teacherOptions([])).toEqual([])
  })

  it("appends the email only to names that two teachers share", () => {
    const teachers = [
      {
        name: "Gao Ah Xing",
        subject: "Art",
        email: "gao.one@example.com",
        contactNumber: "61111111",
      },
      {
        name: "Hannah Low",
        subject: "Art",
        email: "hannah@example.com",
        contactNumber: "62222222",
      },
      {
        name: "Gao Ah Xing",
        subject: "Music",
        email: "gao.two@example.com",
        contactNumber: "63333333",
      },
    ]

    expect(teacherOptions(teachers).map((option) => option.label)).toEqual([
      "Gao Ah Xing (gao.one@example.com)",
      "Hannah Low",
      "Gao Ah Xing (gao.two@example.com)",
    ])
  })
})
