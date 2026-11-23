import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import { ThemeProvider } from "./components/ui/index.ts"

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <h1>School Portal</h1>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
