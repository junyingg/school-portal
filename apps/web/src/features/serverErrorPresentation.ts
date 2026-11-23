import { ApiError, GENERIC_ERROR_MESSAGE } from "../api/ApiError.ts"

export interface FieldErrorPresentation<Field extends string> {
  readonly kind: "field"
  readonly field: Field
  readonly message: string
}

export interface BannerErrorPresentation {
  readonly kind: "banner"
  readonly message: string
}

export type ServerErrorPresentation<Field extends string> =
  FieldErrorPresentation<Field> | BannerErrorPresentation

export function bannerFor(error: unknown): BannerErrorPresentation {
  return {
    kind: "banner",
    message: error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE,
  }
}
