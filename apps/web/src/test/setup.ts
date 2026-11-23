import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
import { setupMswServer } from "./msw/server.ts"

function unmatchedMediaQuery(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }
}

class NoopResizeObserver implements ResizeObserver {
  observe(): void {
    return undefined
  }

  unobserve(): void {
    return undefined
  }

  disconnect(): void {
    return undefined
  }
}

window.matchMedia = unmatchedMediaQuery
window.ResizeObserver = NoopResizeObserver

setupMswServer()

afterEach(() => {
  cleanup()
})
