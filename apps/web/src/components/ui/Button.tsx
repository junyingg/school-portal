import { Button as AntButton } from "antd"
import type { ReactNode } from "react"

export type ButtonVariant = "primary" | "outlined" | "danger"

interface ButtonProps {
  readonly children: ReactNode
  readonly variant?: ButtonVariant
  readonly icon?: ReactNode
  readonly type?: "button" | "submit"
  readonly disabled?: boolean
  readonly accessibleName?: string
  readonly onClick?: () => void
}

const ANT_TYPE_BY_VARIANT = {
  primary: "primary",
  outlined: "default",
  danger: "link",
} as const

export function Button({
  children,
  variant = "primary",
  icon,
  type = "button",
  disabled = false,
  accessibleName,
  onClick,
}: ButtonProps) {
  return (
    <AntButton
      type={ANT_TYPE_BY_VARIANT[variant]}
      danger={variant === "danger"}
      icon={icon}
      htmlType={type}
      disabled={disabled}
      {...(accessibleName === undefined ? {} : { "aria-label": accessibleName })}
      {...(onClick === undefined ? {} : { onClick })}
    >
      {children}
    </AntButton>
  )
}
