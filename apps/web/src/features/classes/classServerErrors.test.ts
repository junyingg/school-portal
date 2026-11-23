import {
  FORM_TEACHER_TAKEN_MESSAGE,
  RESOURCE_EXISTS_MESSAGE,
  unknownTeacherEmailMessage,
} from "@school-portal/contract"
import { describe, expect, it } from "vitest"
import { ApiError } from "../../api/ApiError.ts"
import { presentClassServerError } from "./classServerErrors.ts"

const SENT_EMAIL = "hannah.low@example.com"
const GENERIC_MESSAGE = "Something went wrong. Please try again."

describe("presentClassServerError", () => {
  it("puts a taken form teacher under Form Teacher in design voice", () => {
    expect(
      presentClassServerError(new ApiError(409, FORM_TEACHER_TAKEN_MESSAGE), SENT_EMAIL),
    ).toStrictEqual({
      kind: "field",
      field: "teacherEmail",
      message: "This teacher is already the form teacher of another class.",
    })
  })

  it("puts an unknown form teacher under Form Teacher in design voice", () => {
    expect(
      presentClassServerError(
        new ApiError(400, unknownTeacherEmailMessage(SENT_EMAIL)),
        SENT_EMAIL,
      ),
    ).toStrictEqual({
      kind: "field",
      field: "teacherEmail",
      message: "This form teacher could not be found.",
    })
  })

  it("shows an unknown-teacher message for a different email in the banner", () => {
    const message = unknownTeacherEmailMessage("someone.else@example.com")

    expect(presentClassServerError(new ApiError(400, message), SENT_EMAIL)).toStrictEqual({
      kind: "banner",
      message,
    })
  })

  it.each([
    [400, "level is required"],
    [409, RESOURCE_EXISTS_MESSAGE],
    [500, "Internal server error"],
  ])("shows any other %i in the banner with the server's message", (status, message) => {
    expect(presentClassServerError(new ApiError(status, message), SENT_EMAIL)).toStrictEqual({
      kind: "banner",
      message,
    })
  })

  it("shows a network failure in the banner with the generic message", () => {
    expect(presentClassServerError(new ApiError(0, GENERIC_MESSAGE), SENT_EMAIL)).toStrictEqual({
      kind: "banner",
      message: GENERIC_MESSAGE,
    })
  })
})
