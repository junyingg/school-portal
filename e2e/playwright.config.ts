import { existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { defineConfig, devices } from "@playwright/test"

const ROOT_ENV_FILE = fileURLToPath(new URL("../.env", import.meta.url))

if (existsSync(ROOT_ENV_FILE)) {
  process.loadEnvFile(ROOT_ENV_FILE)
}

const baseURL = process.env["E2E_BASE_URL"]
if (baseURL === undefined || baseURL === "") {
  throw new Error("Set E2E_BASE_URL to the running stack, for example http://localhost:8080")
}

const isCI = process.env["CI"] !== undefined

export default defineConfig({
  testDir: "./tests",
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
