import { Form } from "antd"
import type { ReactNode } from "react"
import styles from "./FormField.module.css"

interface FormFieldProps {
  readonly label: string
  readonly controlId: string
  readonly messageId: string
  readonly error: string | undefined
  readonly children: ReactNode
}

export function FormField({ label, controlId, messageId, error, children }: FormFieldProps) {
  const hasError = error !== undefined
  return (
    <div className={styles["field"]}>
      <Form.Item
        label={label}
        htmlFor={controlId}
        validateStatus={hasError ? "error" : ""}
        help={hasError ? <span id={messageId}>{error}</span> : null}
      >
        {children}
      </Form.Item>
    </div>
  )
}
