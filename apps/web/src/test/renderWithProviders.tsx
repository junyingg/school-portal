import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, type RenderResult } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router"
import { ThemeProvider } from "../components/ui/index.ts"

interface RenderOptions {
  readonly route?: string
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  { route = "/" }: RenderOptions = {},
): RenderResult {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <ThemeProvider disableMotion>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}
