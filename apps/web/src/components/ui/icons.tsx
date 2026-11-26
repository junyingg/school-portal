import { ArrowLeftOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons"

const ICON_SIZE = 24

export function GraduationCapIcon() {
  return (
    <svg
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-6.82 9.43L5 16c0 2.21 3.13 4 7 4s7-1.79 7-4l-.18-3.57L12 16l-6.82-3.57Z" />
    </svg>
  )
}

export function AddIcon() {
  return <PlusOutlined aria-hidden="true" />
}

export function BackIcon() {
  return <ArrowLeftOutlined aria-hidden="true" />
}

export function DeleteIcon() {
  return <DeleteOutlined aria-hidden="true" />
}
