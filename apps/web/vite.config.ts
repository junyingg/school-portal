import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defaultClientConditions, defaultServerConditions, defineConfig, loadEnv } from "vite"

const REPOSITORY_ROOT = fileURLToPath(new URL("../..", import.meta.url))
const SOURCE_CONDITION = "@school-portal/source"
const DEV_SERVER_PORT = 5173
const DEFAULT_API_PROXY_TARGET = "http://localhost:3000"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, REPOSITORY_ROOT, "API_PROXY_")
  return {
    plugins: [react()],
    resolve: { conditions: [SOURCE_CONDITION, ...defaultClientConditions] },
    ssr: { resolve: { conditions: [SOURCE_CONDITION, ...defaultServerConditions] } },
    server: {
      port: DEV_SERVER_PORT,
      proxy: { "/api": env["API_PROXY_TARGET"] ?? DEFAULT_API_PROXY_TARGET },
    },
  }
})
