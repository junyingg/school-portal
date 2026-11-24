import { Select, type RefSelectProps } from "antd"
import type { ReactNode, Ref } from "react"

export interface SelectOption {
  readonly label: string
  readonly value: string
}

interface SelectInputProps {
  readonly id: string
  readonly value: string | undefined
  readonly options: readonly SelectOption[]
  readonly placeholder: string
  readonly isInvalid: boolean
  readonly describedBy: string | undefined
  readonly isLoading?: boolean
  readonly popupContent?: ReactNode
  readonly onChange: (value: string) => void
  readonly onBlur: () => void
  readonly onOpenChange?: (isOpen: boolean) => void
  readonly ref?: Ref<RefSelectProps>
}

export function SelectInput({
  id,
  value,
  options,
  placeholder,
  isInvalid,
  describedBy,
  isLoading = false,
  popupContent,
  onChange,
  onBlur,
  onOpenChange,
  ref,
}: SelectInputProps) {
  return (
    <Select
      id={id}
      options={options.map((option) => ({ label: option.label, value: option.value }))}
      placeholder={placeholder}
      status={isInvalid ? "error" : ""}
      aria-invalid={isInvalid}
      aria-required="true"
      aria-describedby={describedBy}
      aria-busy={isLoading}
      loading={isLoading}
      virtual={false}
      showSearch={false}
      onChange={onChange}
      onBlur={onBlur}
      {...(value === undefined ? {} : { value })}
      {...(ref === undefined ? {} : { ref })}
      {...(popupContent === undefined ? {} : { popupRender: () => popupContent })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    />
  )
}
