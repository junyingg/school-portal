import { errorResponseSchema } from "@school-portal/contract"

export const WRITE_ERROR_RESPONSES = {
  400: errorResponseSchema,
  409: errorResponseSchema,
  413: errorResponseSchema,
  415: errorResponseSchema,
  500: errorResponseSchema,
}

export const READ_ERROR_RESPONSES = {
  500: errorResponseSchema,
}
