import { Form } from "antd"
import type { FormEventHandler, ReactNode } from "react"

interface FormLayoutProps {
  readonly label: string
  readonly onSubmit: FormEventHandler<HTMLFormElement>
  readonly children: ReactNode
}

export function FormLayout({ label, onSubmit, children }: FormLayoutProps) {
  return (
    <form aria-label={label} noValidate onSubmit={onSubmit}>
      <Form component={false} layout="vertical" requiredMark={false}>
        {children}
      </Form>
    </form>
  )
}
