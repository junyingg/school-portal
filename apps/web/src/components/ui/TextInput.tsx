import { Input, type InputRef } from "antd"
import type { Ref } from "react"

interface TextInputProps {
  readonly id: string
  readonly value: string
  readonly placeholder: string
  readonly isInvalid: boolean
  readonly describedBy: string | undefined
  readonly onChange: (value: string) => void
  readonly onBlur: () => void
  readonly ref?: Ref<InputRef>
}

export function TextInput({
  id,
  value,
  placeholder,
  isInvalid,
  describedBy,
  onChange,
  onBlur,
  ref,
}: TextInputProps) {
  return (
    <Input
      id={id}
      ref={ref}
      value={value}
      placeholder={placeholder}
      status={isInvalid ? "error" : ""}
      aria-invalid={isInvalid}
      aria-describedby={describedBy}
      onChange={(event) => {
        onChange(event.target.value)
      }}
      onBlur={onBlur}
    />
  )
}
