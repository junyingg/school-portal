import type { ThemeConfig } from "antd"

export const BRAND_BLUE = "#135bb4"
export const ERROR_RED = "#e22c3b"
export const TEXT_COLOR = "#333333"
export const PAGE_BACKGROUND = "#f7f7f7"
export const DIVIDER_COLOR = "#f0f0f0"
export const ACCESSIBLE_PLACEHOLDER_COLOR = "#767676"
export const ACCESSIBLE_BORDER_COLOR = "#8c8c8c"
export const CONTROL_HEIGHT = 48

export const schoolPortalTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND_BLUE,
    colorLink: BRAND_BLUE,
    colorError: ERROR_RED,
    colorText: TEXT_COLOR,
    colorTextPlaceholder: ACCESSIBLE_PLACEHOLDER_COLOR,
    colorBorder: ACCESSIBLE_BORDER_COLOR,
    colorBgLayout: PAGE_BACKGROUND,
    controlHeight: CONTROL_HEIGHT,
    borderRadius: 4,
    borderRadiusLG: 8,
    fontSize: 14,
  },
  components: {
    Table: { headerBg: PAGE_BACKGROUND, borderColor: DIVIDER_COLOR },
  },
}
