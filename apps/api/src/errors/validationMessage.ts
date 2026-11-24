import { NOT_AN_OBJECT_MESSAGE } from "@school-portal/contract"

export interface ValidationIssue {
  readonly instancePath: string
  readonly message?: string | undefined
}

const WHOLE_BODY_PATH = "/"
const VALIDATION_MESSAGE_SEPARATOR = "; "

function firstMessagePerField(issues: readonly ValidationIssue[]): string[] {
  const messageByField = new Map<string, string>()
  for (const issue of issues) {
    const isFirstForField = !messageByField.has(issue.instancePath)
    if (issue.message !== undefined && isFirstForField) {
      messageByField.set(issue.instancePath, issue.message)
    }
  }
  return [...messageByField.values()]
}

export function toValidationMessage(issues: readonly ValidationIssue[]): string {
  const isWholeBodyInvalid = issues.some((issue) => issue.instancePath === WHOLE_BODY_PATH)
  if (isWholeBodyInvalid) {
    return NOT_AN_OBJECT_MESSAGE
  }
  return firstMessagePerField(issues).join(VALIDATION_MESSAGE_SEPARATOR)
}
