import { ConfigProvider } from "antd"
import type { ReactNode } from "react"
import { schoolPortalTheme } from "./theme.ts"

interface ThemeProviderProps {
  readonly children: ReactNode
  readonly disableMotion?: boolean
}

const STILL_THEME = {
  ...schoolPortalTheme,
  token: { ...schoolPortalTheme.token, motion: false },
}

export function ThemeProvider({ children, disableMotion = false }: ThemeProviderProps) {
  return (
    <ConfigProvider theme={disableMotion ? STILL_THEME : schoolPortalTheme}>
      {children}
    </ConfigProvider>
  )
}
