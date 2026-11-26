import { Button as AntButton } from "antd"
import type { ReactNode } from "react"

export type ButtonVariant = "primary" | "outlined"

interface ButtonProps {
  readonly children: ReactNode
  readonly variant?: ButtonVariant
  readonly icon?: ReactNode
  readonly type?: "button" | "submit"
  readonly disabled?: boolean
  readonly onClick?: () => void
}

export function Button({
  children,
  variant = "primary",
  icon,
  type = "button",
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <AntButton
      type={variant === "primary" ? "primary" : "default"}
      icon={icon}
      htmlType={type}
      disabled={disabled}
      {...(onClick === undefined ? {} : { onClick })}
    >
      {children}
    </AntButton>
  )
}
