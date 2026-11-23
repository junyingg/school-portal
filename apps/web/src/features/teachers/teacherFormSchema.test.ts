import { SUBJECTS, createTeacherRequestSchema } from "@school-portal/contract"
import { describe, expect, it } from "vitest"
import { TEACHER_FIELD_MESSAGES } from "./teacherFieldMessages.ts"
import { teacherFormSchema } from "./teacherFormSchema.ts"

const VALID_VALUES = {
  name: "Mary",
  subject: "Mathematics",
  email: "teachermary@gmail.com",
  contactNumber: "68129414",
}

function messagesFor(values: Record<string, unknown>): string[] {
  const result = teacherFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("teacherFormSchema contact number", () => {
  it.each([
    ["6123 4567", "61234567"],
    ["68129414", "68129414"],
    ["91234567", "91234567"],
    ["9283 9999", "92839999"],
  ])("accepts %j as %s", (contactNumber, digits) => {
    expect(teacherFormSchema.parse({ ...VALID_VALUES, contactNumber }).contactNumber).toBe(digits)
  })

  it.each(["6123456", "612345678", "6123-4567", "6123456a"])("rejects %j", (contactNumber) => {
    expect(messagesFor({ ...VALID_VALUES, contactNumber })).toEqual([
      TEACHER_FIELD_MESSAGES.contactNumberInvalid,
    ])
  })

  it.each(["", "   "])("reports %j as required", (contactNumber) => {
    expect(messagesFor({ ...VALID_VALUES, contactNumber })).toEqual([
      "This work contact number is required.",
    ])
  })
})

describe("teacherFormSchema name", () => {
  it("reports whitespace as required", () => {
    expect(messagesFor({ ...VALID_VALUES, name: "   " })).toEqual(["This name is required."])
  })

  it("trims the name", () => {
    expect(teacherFormSchema.parse({ ...VALID_VALUES, name: " Mary " }).name).toBe("Mary")
  })

  it("rejects 101 characters", () => {
    expect(messagesFor({ ...VALID_VALUES, name: "x".repeat(101) })).toEqual([
      TEACHER_FIELD_MESSAGES.nameTooLong,
    ])
  })

  it("rejects a control character", () => {
    expect(messagesFor({ ...VALID_VALUES, name: "Ma\u0007ry" })).toEqual([
      TEACHER_FIELD_MESSAGES.nameHasControlCharacters,
    ])
  })
})

describe("teacherFormSchema subject", () => {
  it.each(SUBJECTS)("accepts %s", (subject) => {
    expect(teacherFormSchema.parse({ ...VALID_VALUES, subject }).subject).toBe(subject)
  })

  it.each([undefined, ""])("reports %j as required", (subject) => {
    expect(messagesFor({ ...VALID_VALUES, subject })).toEqual(["This subject is required."])
  })

  it("reports a value outside the list as invalid", () => {
    expect(messagesFor({ ...VALID_VALUES, subject: "Physics" })).toEqual([
      TEACHER_FIELD_MESSAGES.subjectInvalid,
    ])
  })
})

describe("teacherFormSchema email", () => {
  it.each(["mary@", "teacher@gov", "ma ry@x.sg"])("rejects %j", (email) => {
    expect(messagesFor({ ...VALID_VALUES, email })).toEqual(["This email address is invalid."])
  })

  it("accepts teacher@gov.sg, which the design's error frame marks invalid", () => {
    expect(teacherFormSchema.parse({ ...VALID_VALUES, email: "teacher@gov.sg" }).email).toBe(
      "teacher@gov.sg",
    )
  })

  it("reports an empty email as required", () => {
    expect(messagesFor({ ...VALID_VALUES, email: "" })).toEqual(["This email address is required."])
  })

  it("trims the email", () => {
    expect(teacherFormSchema.parse({ ...VALID_VALUES, email: " a@b.co " }).email).toBe("a@b.co")
  })

  it("rejects 255 characters", () => {
    const email = `${"a".repeat(243)}@example.com`

    expect(messagesFor({ ...VALID_VALUES, email })).toEqual([TEACHER_FIELD_MESSAGES.emailTooLong])
  })
})

describe("teacherFormSchema as a whole", () => {
  it("reports all four empty fields at once", () => {
    expect(
      messagesFor({ name: "", subject: undefined, email: "", contactNumber: "" }),
    ).toHaveLength(4)
  })
})

describe("teacherFormSchema agrees with the API contract", () => {
  it.each(SUBJECTS)("lets the API accept the subject %s", (subject) => {
    const formOutput = teacherFormSchema.parse({ ...VALID_VALUES, subject })

    expect(createTeacherRequestSchema.safeParse(formOutput).success).toBe(true)
  })

  it.each(["6123 4567", "68129414", " 6 1 2 3 4 5 6 7 "])(
    "lets the API accept the contact %j once the form has stripped it",
    (contactNumber) => {
      const formOutput = teacherFormSchema.parse({ ...VALID_VALUES, contactNumber })

      expect(createTeacherRequestSchema.safeParse(formOutput).success).toBe(true)
    },
  )
})
