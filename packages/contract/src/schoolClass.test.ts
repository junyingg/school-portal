import { describe, expect, it } from "vitest"
import { z } from "zod"
import { SPEC_CLASSES, SPEC_CREATE_CLASS_REQUEST, SPEC_TEACHERS } from "./examples.ts"
import { CLASS_LEVEL_MAX_LENGTH } from "./fieldRules.ts"
import { CLASS_LEVELS } from "./optionLists.ts"
import {
  classListResponseSchema,
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

  it.each(["Secondary 3", "primary 1", "Primary 7", "  Secondary 3  "])(
    "accepts the level %j, trimming it",
    (level) => {
      expect(createClassRequestSchema.parse({ ...CLASS_1A, level }).level).toBe(level.trim())
    },
  )

  it("accepts a level at the maximum length and rejects one over it", () => {
    const longest = "x".repeat(CLASS_LEVEL_MAX_LENGTH)

    expect(createClassRequestSchema.parse({ ...CLASS_1A, level: longest }).level).toBe(longest)
    expect(issueMessages({ ...CLASS_1A, level: "x".repeat(CLASS_LEVEL_MAX_LENGTH + 1) })).toEqual([
      `level must be at most ${CLASS_LEVEL_MAX_LENGTH} characters`,
    ])
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
  it("carries only the form teacher's name", () => {
    expect(
      schoolClassSchema.parse({ ...FIRST_CLASS, formTeacher: MARY }).formTeacher,
    ).toStrictEqual({ name: "Mary" })
  })

  it("keeps the key order level, name, formTeacher", () => {
    const shuffled = {
      formTeacher: FIRST_CLASS.formTeacher,
      name: FIRST_CLASS.name,
      level: FIRST_CLASS.level,
    }

    expect(Object.keys(schoolClassSchema.parse(shuffled))).toEqual(["level", "name", "formTeacher"])
  })
})

describe("classListResponseSchema", () => {
  it("accepts the spec list", () => {
    expect(classListResponseSchema.parse({ data: SPEC_CLASSES })).toStrictEqual({
      data: SPEC_CLASSES,
    })
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
        formTeacher: { type: "object", required: ["name"], additionalProperties: false },
      },
    })
  })
})
