import { CLASS_LEVELS, createClassRequestSchema } from "@school-portal/contract"
import { describe, expect, it } from "vitest"
import { CLASS_FIELD_MESSAGES } from "./classFieldMessages.ts"
import { classFormSchema } from "./classFormSchema.ts"

const VALID_VALUES = {
  level: "Primary 1",
  name: "Class 1A",
  teacherEmail: "teachermary@gmail.com",
}

function messagesFor(values: Record<string, unknown>): string[] {
  const result = classFormSchema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("classFormSchema level", () => {
  it.each(CLASS_LEVELS)("accepts %s", (level) => {
    expect(classFormSchema.parse({ ...VALID_VALUES, level }).level).toBe(level)
  })

  it.each([undefined, ""])("reports %j as required", (level) => {
    expect(messagesFor({ ...VALID_VALUES, level })).toEqual(["This class level is required."])
  })

  it("reports a level outside the list as invalid", () => {
    expect(messagesFor({ ...VALID_VALUES, level: "Primary 7" })).toEqual([
      CLASS_FIELD_MESSAGES.levelInvalid,
    ])
  })
})

describe("classFormSchema name", () => {
  it("reports whitespace as required", () => {
    expect(messagesFor({ ...VALID_VALUES, name: "  " })).toEqual(["This class name is required."])
  })

  it("trims the name", () => {
    expect(classFormSchema.parse({ ...VALID_VALUES, name: " Class 1A " }).name).toBe("Class 1A")
  })

  it("rejects 51 characters", () => {
    expect(messagesFor({ ...VALID_VALUES, name: "x".repeat(51) })).toEqual([
      CLASS_FIELD_MESSAGES.nameTooLong,
    ])
  })
})

describe("classFormSchema form teacher", () => {
  it("reports a missing form teacher as required", () => {
    expect(messagesFor({ ...VALID_VALUES, teacherEmail: undefined })).toEqual([
      "This form teacher is required.",
    ])
  })
})

describe("classFormSchema as a whole", () => {
  it("reports all three empty fields at once", () => {
    expect(messagesFor({ level: undefined, name: "", teacherEmail: undefined })).toHaveLength(3)
  })
})

describe("classFormSchema agrees with the API contract", () => {
  it.each(CLASS_LEVELS)("lets the API accept the level %s", (level) => {
    const formOutput = classFormSchema.parse({ ...VALID_VALUES, level })

    expect(createClassRequestSchema.safeParse(formOutput).success).toBe(true)
  })
})
