export const NETWORK_FAILURE_STATUS = 0
export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again."

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}
