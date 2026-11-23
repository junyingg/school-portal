import { useId } from "react"

export interface FieldIds {
  readonly controlId: string
  readonly messageId: string
}

export function useFieldIds(): FieldIds {
  const controlId = useId()
  return { controlId, messageId: `${controlId}-message` }
}
