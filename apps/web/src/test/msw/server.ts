import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"
import { handlers, resetStore } from "./handlers.ts"

export const server = setupServer(...handlers)

export interface LoggedRequest {
  readonly method: string
  readonly pathname: string
}

export const requestLog: LoggedRequest[] = []

server.events.on("request:start", ({ request }) => {
  requestLog.push({ method: request.method, pathname: new URL(request.url).pathname })
})

export function setupMswServer(): void {
  beforeAll(() => {
    server.listen({ onUnhandledFrame: "error" })
  })
  afterEach(() => {
    server.resetHandlers()
    resetStore()
    requestLog.length = 0
  })
  afterAll(() => {
    server.close()
  })
}
