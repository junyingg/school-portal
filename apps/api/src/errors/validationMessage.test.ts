import { describe, expect, it } from "vitest"
import { toValidationMessage } from "./validationMessage.ts"

describe("toValidationMessage", () => {
  it('joins distinct messages with "; " in order', () => {
    const issues = [
      { instancePath: "/name", message: "name is required" },
      { instancePath: "/email", message: "email must be a valid email address" },
      { instancePath: "/email", message: "email must be a valid email address" },
    ]

    expect(toValidationMessage(issues)).toBe(
      "name is required; email must be a valid email address",
    )
  })

  it("reports a whole-body issue as a non-object body", () => {
    const issues = [
      { instancePath: "/", message: "Invalid input: expected object, received array" },
    ]

    expect(toValidationMessage(issues)).toBe("Request body must be a JSON object")
  })

  it("skips issues without a message", () => {
    const issues = [
      { instancePath: "/name" },
      { instancePath: "/email", message: "email is required" },
    ]

    expect(toValidationMessage(issues)).toBe("email is required")
  })
})
