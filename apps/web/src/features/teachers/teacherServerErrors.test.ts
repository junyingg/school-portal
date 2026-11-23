import {
  CONTACT_NUMBER_MESSAGE,
  RESOURCE_EXISTS_MESSAGE,
  TEACHER_EMAIL_TAKEN_MESSAGE,
} from "@school-portal/contract"
import { describe, expect, it } from "vitest"
import { ApiError } from "../../api/ApiError.ts"
import { presentTeacherServerError } from "./teacherServerErrors.ts"

const GENERIC_MESSAGE = "Something went wrong. Please try again."

describe("presentTeacherServerError", () => {
  it("puts a duplicate email under the Email Address field in design voice", () => {
    expect(presentTeacherServerError(new ApiError(409, TEACHER_EMAIL_TAKEN_MESSAGE))).toStrictEqual(
      {
        kind: "field",
        field: "email",
        message: "This email address is already registered.",
      },
    )
  })

  it.each([
    [400, CONTACT_NUMBER_MESSAGE],
    [409, RESOURCE_EXISTS_MESSAGE],
    [500, "Internal server error"],
  ])("shows any other %i in the banner with the server's message", (status, message) => {
    expect(presentTeacherServerError(new ApiError(status, message))).toStrictEqual({
      kind: "banner",
      message,
    })
  })

  it("shows a network failure in the banner with the generic message", () => {
    expect(presentTeacherServerError(new ApiError(0, GENERIC_MESSAGE))).toStrictEqual({
      kind: "banner",
      message: GENERIC_MESSAGE,
    })
  })

  it("shows an unexpected error in the banner with the generic message", () => {
    expect(presentTeacherServerError(new Error("boom"))).toStrictEqual({
      kind: "banner",
      message: GENERIC_MESSAGE,
    })
  })
})
