import { useEffect } from "react"

export interface ServerFieldError<Field extends string> {
  readonly field: Field
  readonly message: string
}

export function useFocusFieldOnServerError<Field extends string>(
  serverError: ServerFieldError<Field> | undefined,
  focusField: (field: Field) => void,
): void {
  const field = serverError?.field
  const message = serverError?.message
  useEffect(() => {
    if (field !== undefined) {
      focusField(field)
    }
  }, [field, message, focusField])
}
