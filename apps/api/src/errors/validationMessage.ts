import { NOT_AN_OBJECT_MESSAGE } from "@school-portal/contract"

export interface ValidationIssue {
  readonly instancePath: string
  readonly message?: string | undefined
}

const WHOLE_BODY_PATH = "/"
const VALIDATION_MESSAGE_SEPARATOR = "; "

export function toValidationMessage(issues: readonly ValidationIssue[]): string {
  const isWholeBodyInvalid = issues.some((issue) => issue.instancePath === WHOLE_BODY_PATH)
  if (isWholeBodyInvalid) {
    return NOT_AN_OBJECT_MESSAGE
  }
  const messages = issues.flatMap((issue) => (issue.message === undefined ? [] : [issue.message]))
  const distinctMessages = [...new Set(messages)]
  return distinctMessages.join(VALIDATION_MESSAGE_SEPARATOR)
}
