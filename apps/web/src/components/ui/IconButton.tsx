import { Button as AntButton, Tooltip } from "antd"
import type { ReactNode } from "react"

interface IconButtonProps {
  readonly icon: ReactNode
  readonly accessibleName: string
  readonly tooltip: string
  readonly isDanger?: boolean
  readonly onClick: () => void
}

export function IconButton({
  icon,
  accessibleName,
  tooltip,
  isDanger = false,
  onClick,
}: IconButtonProps) {
  return (
    <Tooltip title={tooltip}>
      <AntButton
        type="text"
        danger={isDanger}
        icon={icon}
        aria-label={accessibleName}
        onClick={onClick}
      />
    </Tooltip>
  )
}
