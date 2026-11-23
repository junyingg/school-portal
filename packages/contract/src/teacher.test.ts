import { describe, expect, it } from "vitest"
import { z } from "zod"
import { SPEC_TEACHERS } from "./examples.ts"
import { SUBJECT_MAX_LENGTH } from "./fieldRules.ts"
import { SUBJECTS } from "./optionLists.ts"
import { createTeacherRequestSchema, teacherListResponseSchema, teacherSchema } from "./teacher.ts"

const [MARY, KEN] = SPEC_TEACHERS

function issueMessages(input: unknown): string[] {
  const result = createTeacherRequestSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("createTeacherRequestSchema", () => {
  it.each([MARY, KEN])("parses the spec payload for $name unchanged", (teacher) => {
    expect(createTeacherRequestSchema.parse(teacher)).toStrictEqual(teacher)
  })

  it("strips unknown keys", () => {
    expect(createTeacherRequestSchema.parse({ ...MARY, id: 9, role: "admin" })).toStrictEqual(MARY)
  })

  it.each(["O'Brien", "高亚星", "Gao Ah Xing"])("accepts the name %s", (name) => {
    expect(createTeacherRequestSchema.parse({ ...MARY, name }).name).toBe(name)
  })

  it("rejects a control character in name", () => {
    expect(issueMessages({ ...MARY, name: "Mary\u0000" })).toEqual([
      "name must not contain control characters",
    ])
  })

  it.each(SUBJECTS)("accepts the subject %s", (subject) => {
    expect(createTeacherRequestSchema.parse({ ...MARY, subject }).subject).toBe(subject)
  })

  it.each(["Chemistry", "mathematics", "Physics", "  Physics  "])(
    "accepts the subject %j, trimming it",
    (subject) => {
      expect(createTeacherRequestSchema.parse({ ...MARY, subject }).subject).toBe(subject.trim())
    },
  )

  it("accepts a subject at the maximum length and rejects one over it", () => {
    const longest = "x".repeat(SUBJECT_MAX_LENGTH)

    expect(createTeacherRequestSchema.parse({ ...MARY, subject: longest }).subject).toBe(longest)
    expect(issueMessages({ ...MARY, subject: "x".repeat(SUBJECT_MAX_LENGTH + 1) })).toEqual([
      `subject must be at most ${SUBJECT_MAX_LENGTH} characters`,
    ])
  })

  it("rejects a non-string subject", () => {
    expect(issueMessages({ ...MARY, subject: 5 })).toEqual(["subject must be a string"])
  })

  it.each([undefined, "  "])("reports the subject %j as required", (subject) => {
    expect(issueMessages({ ...MARY, subject })).toEqual(["subject is required"])
  })

  it("rejects a malformed teacher email", () => {
    expect(issueMessages({ ...MARY, email: "mary" })).toEqual([
      "email must be a valid email address",
    ])
    expect(issueMessages({ ...MARY, email: 5 })).toEqual(["email must be a string"])
  })

  it("enforces the name max length", () => {
    const hundredCharacters = "x".repeat(100)

    expect(createTeacherRequestSchema.parse({ ...MARY, name: hundredCharacters }).name).toBe(
      hundredCharacters,
    )
    expect(issueMessages({ ...MARY, name: "x".repeat(101) })).toEqual([
      "name must be at most 100 characters",
    ])
  })

  it("rejects a non-string name", () => {
    expect(issueMessages({ ...MARY, name: 5 })).toEqual(["name must be a string"])
  })

  it("reports every missing field in key order", () => {
    expect(issueMessages({})).toEqual([
      "name is required",
      "subject is required",
      "email is required",
      "contactNumber is required",
    ])
  })

  it.each([[[]], ["x"], [null], [42]])("rejects the non-object root %j", (input) => {
    const result = createTeacherRequestSchema.safeParse(input)

    expect(result.error?.issues.map((issue) => issue.path)).toEqual([[]])
  })
})

describe("teacherSchema", () => {
  it("keeps spec key order", () => {
    const shuffled = {
      contactNumber: MARY.contactNumber,
      email: MARY.email,
      subject: MARY.subject,
      name: MARY.name,
    }

    expect(Object.keys(teacherSchema.parse(shuffled))).toEqual([
      "name",
      "subject",
      "email",
      "contactNumber",
    ])
  })
})

describe("teacherListResponseSchema", () => {
  it("accepts an empty list", () => {
    expect(teacherListResponseSchema.parse({ data: [] })).toStrictEqual({ data: [] })
  })
})

describe("teacherSchema as JSON Schema", () => {
  it("emits a closed draft-07 object with four required keys", () => {
    const jsonSchema = z.toJSONSchema(teacherSchema, { target: "draft-07" })

    expect(jsonSchema).toMatchObject({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      required: ["name", "subject", "email", "contactNumber"],
      additionalProperties: false,
    })
  })
})
