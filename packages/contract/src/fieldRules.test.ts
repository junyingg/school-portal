import { describe, expect, it } from "vitest"
import type { z } from "zod"
import {
  CONTACT_NUMBER_MESSAGE,
  CONTACT_NUMBER_PATTERN,
  LEVEL_NOT_LISTED_MESSAGE,
  SIMPLE_EMAIL_PATTERN,
  SUBJECT_NOT_LISTED_MESSAGE,
  contactNumberField,
  emailField,
  requiredText,
} from "./fieldRules.ts"

function issueMessages(schema: z.ZodType, input: unknown): string[] {
  const result = schema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

const EMAIL_DOMAIN = "@example.com"

function emailOfLength(length: number): string {
  return "a".repeat(length - EMAIL_DOMAIN.length) + EMAIL_DOMAIN
}

describe("CONTACT_NUMBER_PATTERN", () => {
  it("is the API rule", () => {
    expect(CONTACT_NUMBER_PATTERN.source).toBe("^\\d{8}$")
  })
})

describe("contactNumberField", () => {
  it.each(["61234567", "68129414", "91234567", "81234567", "92839999"])("accepts %s", (value) => {
    expect(contactNumberField().parse(value)).toBe(value)
  })

  it("trims surrounding spaces", () => {
    expect(contactNumberField().parse(" 61234567 ")).toBe("61234567")
  })

  it.each([
    "6123 4567",
    "6 1 2 3 4 5 6 7",
    "6123456",
    "612345678",
    "6123456a",
    "6123-4567",
    "６１２３４５６７",
  ])("rejects %s", (value) => {
    expect(issueMessages(contactNumberField(), value)).toEqual([CONTACT_NUMBER_MESSAGE])
  })

  it("rejects a number", () => {
    expect(issueMessages(contactNumberField(), 61234567)).toEqual([
      "contactNumber must be a string",
    ])
  })

  it.each(["", "   "])("reports %j as required", (value) => {
    expect(issueMessages(contactNumberField(), value)).toEqual(["contactNumber is required"])
  })
})

describe("message constants", () => {
  it("hold their exact text", () => {
    expect(CONTACT_NUMBER_MESSAGE).toBe("contactNumber must be 8 digits")
    expect(SUBJECT_NOT_LISTED_MESSAGE).toBe(
      "subject must be one of: English Language, Mother Tongue Language, Mathematics, Science, Art, Music, Physical Education, Social Studies, Character and Citizenship Education",
    )
    expect(LEVEL_NOT_LISTED_MESSAGE).toBe(
      "level must be one of: Primary 1, Primary 2, Primary 3, Primary 4, Primary 5, Primary 6",
    )
  })
})

describe("SIMPLE_EMAIL_PATTERN", () => {
  it.each(["teachermary@gmail.com", "Mary@Gmail.COM", "teacher@gov.sg"])("accepts %s", (value) => {
    expect(SIMPLE_EMAIL_PATTERN.test(value)).toBe(true)
  })

  it.each(["a@b", "a b@c.com", "@c.com", "a@@c.com", "mary"])("rejects %s", (value) => {
    expect(SIMPLE_EMAIL_PATTERN.test(value)).toBe(false)
  })
})

describe("emailField", () => {
  it("accepts 254 characters", () => {
    const email = emailOfLength(254)

    expect(emailField("email").parse(email)).toBe(email)
  })

  it("rejects 255 characters", () => {
    expect(issueMessages(emailField("email"), emailOfLength(255))).toEqual([
      "email must be at most 254 characters",
    ])
  })

  it("trims surrounding spaces", () => {
    expect(emailField("email").parse(" a@b.co ")).toBe("a@b.co")
  })

  it("reports an empty value as required only", () => {
    expect(issueMessages(emailField("email"), "")).toEqual(["email is required"])
  })

  it("names the field in the format message", () => {
    expect(issueMessages(emailField("teacherEmail"), "mary")).toEqual([
      "teacherEmail must be a valid email address",
    ])
  })
})

describe("requiredText", () => {
  it("rejects whitespace only", () => {
    expect(issueMessages(requiredText("name", 100), "   ")).toEqual(["name is required"])
  })

  it("reports a missing value as required", () => {
    expect(issueMessages(requiredText("name", 100), undefined)).toEqual(["name is required"])
  })

  it("measures length after trimming", () => {
    const hundredCharacters = "x".repeat(100)

    expect(requiredText("name", 100).parse(`  ${hundredCharacters}  `)).toBe(hundredCharacters)
    expect(issueMessages(requiredText("name", 100), "x".repeat(101))).toEqual([
      "name must be at most 100 characters",
    ])
  })
})
