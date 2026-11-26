import { describe, expect, it } from "vitest"
import { z } from "zod"
import { SPEC_CLASSES, SPEC_CREATE_CLASS_REQUEST, SPEC_TEACHERS } from "./examples.ts"
import { LEVEL_NOT_LISTED_MESSAGE } from "./fieldRules.ts"
import { CLASS_LEVELS } from "./optionLists.ts"
import {
  classListResponseSchema,
  classPathParamsSchema,
  createClassRequestSchema,
  schoolClassSchema,
} from "./schoolClass.ts"

const CLASS_1A = SPEC_CREATE_CLASS_REQUEST
const [MARY] = SPEC_TEACHERS
const [FIRST_CLASS] = SPEC_CLASSES

function issueMessages(input: unknown): string[] {
  const result = createClassRequestSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("createClassRequestSchema", () => {
  it("parses the spec payload unchanged", () => {
    expect(createClassRequestSchema.parse(CLASS_1A)).toStrictEqual(CLASS_1A)
  })

  it.each(CLASS_LEVELS)("accepts the level %s", (level) => {
    expect(createClassRequestSchema.parse({ ...CLASS_1A, level }).level).toBe(level)
  })

  it.each(["Secondary 3", "primary 1", "Primary 7"])("rejects the level %s", (level) => {
    expect(issueMessages({ ...CLASS_1A, level })).toEqual([LEVEL_NOT_LISTED_MESSAGE])
  })

  it("trims a listed level before matching", () => {
    expect(createClassRequestSchema.parse({ ...CLASS_1A, level: " Primary 1 " }).level).toBe(
      "Primary 1",
    )
  })

  it("rejects a non-string level or teacherEmail", () => {
    expect(issueMessages({ ...CLASS_1A, level: 5 })).toEqual(["level must be a string"])
    expect(issueMessages({ ...CLASS_1A, teacherEmail: 5 })).toEqual([
      "teacherEmail must be a string",
    ])
  })

  it.each([undefined, "  "])("reports the level %j as required", (level) => {
    expect(issueMessages({ ...CLASS_1A, level })).toEqual(["level is required"])
  })

  it("enforces the 50-character class name", () => {
    const fiftyCharacters = "x".repeat(50)

    expect(createClassRequestSchema.parse({ ...CLASS_1A, name: fiftyCharacters }).name).toBe(
      fiftyCharacters,
    )
    expect(issueMessages({ ...CLASS_1A, name: "x".repeat(51) })).toEqual([
      "name must be at most 50 characters",
    ])
  })

  it("requires teacherEmail and checks its format", () => {
    expect(issueMessages({ level: CLASS_1A.level, name: CLASS_1A.name })).toEqual([
      "teacherEmail is required",
    ])
    expect(issueMessages({ ...CLASS_1A, teacherEmail: "bad" })).toEqual([
      "teacherEmail must be a valid email address",
    ])
  })

  it("strips unknown keys", () => {
    expect(createClassRequestSchema.parse({ ...CLASS_1A, formTeacherId: 1 })).toStrictEqual(
      CLASS_1A,
    )
  })
})

describe("schoolClassSchema", () => {
  it("carries the form teacher's name and email and nothing else", () => {
    expect(
      schoolClassSchema.parse({ ...FIRST_CLASS, formTeacher: MARY }).formTeacher,
    ).toStrictEqual({ name: "Mary", email: "teachermary@gmail.com" })
  })

  it("keeps the form teacher key order name, email", () => {
    const formTeacher = { email: MARY.email, name: MARY.name }

    expect(
      Object.keys(schoolClassSchema.parse({ ...FIRST_CLASS, formTeacher }).formTeacher),
    ).toEqual(["name", "email"])
  })

  it("keeps the key order level, name, formTeacher", () => {
    const shuffled = {
      formTeacher: { name: MARY.name, email: MARY.email },
      name: FIRST_CLASS.name,
      level: FIRST_CLASS.level,
    }

    expect(Object.keys(schoolClassSchema.parse(shuffled))).toEqual(["level", "name", "formTeacher"])
  })
})

describe("classListResponseSchema", () => {
  it("accepts a list of classes with their form teachers", () => {
    const classes = [{ ...FIRST_CLASS, formTeacher: { name: MARY.name, email: MARY.email } }]

    expect(classListResponseSchema.parse({ data: classes })).toStrictEqual({ data: classes })
  })
})

describe("schoolClassSchema as JSON Schema", () => {
  it("emits draft-07 with a closed nested formTeacher", () => {
    const jsonSchema = z.toJSONSchema(schoolClassSchema, { target: "draft-07" })

    expect(jsonSchema).toMatchObject({
      $schema: "http://json-schema.org/draft-07/schema#",
      required: ["level", "name", "formTeacher"],
      additionalProperties: false,
      properties: {
        formTeacher: { type: "object", required: ["name", "email"], additionalProperties: false },
      },
    })
  })
})

describe("classPathParamsSchema", () => {
  it("accepts the form teacher's email and trims it", () => {
    expect(classPathParamsSchema.parse({ teacherEmail: " teachermary@gmail.com " })).toStrictEqual({
      teacherEmail: "teachermary@gmail.com",
    })
  })

  it("rejects a malformed email", () => {
    const result = classPathParamsSchema.safeParse({ teacherEmail: "mary" })

    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual([
      "teacherEmail must be a valid email address",
    ])
  })
})
