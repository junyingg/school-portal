import closeWithGrace from "close-with-grace"
import { buildApp } from "./app.ts"

const LISTEN_HOST = "0.0.0.0"
const LISTEN_PORT = 3000
const LOG_LEVEL = "info"
const SHUTDOWN_GRACE_PERIOD_MS = 10_000

const app = buildApp({ config: { logLevel: LOG_LEVEL } })

closeWithGrace({ delay: SHUTDOWN_GRACE_PERIOD_MS }, async ({ err }) => {
  if (err !== undefined) {
    app.log.error({ err }, "Shutting down after an uncaught error")
  }
  await app.close()
})

await app.listen({ host: LISTEN_HOST, port: LISTEN_PORT })
