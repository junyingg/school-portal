import type { ReactNode } from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { useFieldIds } from "./fieldIds.ts"
import { FormField, SelectInput, type SelectOption } from "./ui/index.ts"

interface ControlledSelectProps<Values extends FieldValues, Output> {
  readonly control: Control<Values, unknown, Output>
  readonly name: FieldPath<Values>
  readonly label: string
  readonly placeholder: string
  readonly options: readonly SelectOption[]
  readonly serverMessage?: string | undefined
  readonly isLoading?: boolean
  readonly emptyContent?: ReactNode
  readonly footnote?: ReactNode
  readonly onOpenChange?: (isOpen: boolean) => void
  readonly onEdit?: (() => void) | undefined
}

export function ControlledSelect<Values extends FieldValues, Output>({
  control,
  name,
  label,
  placeholder,
  options,
  serverMessage,
  isLoading = false,
  emptyContent,
  footnote,
  onOpenChange,
  onEdit,
}: ControlledSelectProps<Values, Output>) {
  const { controlId, messageId } = useFieldIds()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message ?? serverMessage
        return (
          <FormField
            label={label}
            controlId={controlId}
            messageId={messageId}
            error={message}
            footnote={footnote}
          >
            <SelectInput
              id={controlId}
              ref={field.ref}
              value={typeof field.value === "string" ? field.value : undefined}
              options={options}
              placeholder={placeholder}
              isInvalid={message !== undefined}
              describedBy={message === undefined ? undefined : messageId}
              isLoading={isLoading}
              emptyContent={emptyContent}
              onChange={(value) => {
                field.onChange(value)
                onEdit?.()
              }}
              onBlur={field.onBlur}
              {...(onOpenChange === undefined ? {} : { onOpenChange })}
            />
          </FormField>
        )
      }}
    />
  )
}
