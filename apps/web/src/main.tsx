import "./configureZod.ts"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"

const rootElement = document.getElementById("root")
if (rootElement === null) {
  throw new Error("The page has no #root element to render into")
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
