import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { useFieldIds } from "./fieldIds.ts"
import { FormField, TextInput } from "./ui/index.ts"

interface ControlledTextInputProps<Values extends FieldValues, Output> {
  readonly control: Control<Values, unknown, Output>
  readonly name: FieldPath<Values>
  readonly label: string
  readonly placeholder: string
  readonly serverMessage?: string | undefined
}

export function ControlledTextInput<Values extends FieldValues, Output>({
  control,
  name,
  label,
  placeholder,
  serverMessage,
}: ControlledTextInputProps<Values, Output>) {
  const { controlId, messageId } = useFieldIds()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const message = fieldState.error?.message ?? serverMessage
        return (
          <FormField label={label} controlId={controlId} messageId={messageId} error={message}>
            <TextInput
              id={controlId}
              ref={field.ref}
              value={typeof field.value === "string" ? field.value : ""}
              placeholder={placeholder}
              isInvalid={message !== undefined}
              describedBy={message === undefined ? undefined : messageId}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </FormField>
        )
      }}
    />
  )
}
