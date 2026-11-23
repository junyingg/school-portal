import closeWithGrace from "close-with-grace"
import { buildApp } from "./app.ts"
import { loadConfig } from "./config/env.ts"

const SHUTDOWN_GRACE_PERIOD_MS = 10_000

const config = loadConfig(process.env)
const app = await buildApp({ config })

closeWithGrace({ delay: SHUTDOWN_GRACE_PERIOD_MS }, async ({ err }) => {
  if (err !== undefined) {
    app.log.error({ err }, "Shutting down after an uncaught error")
  }
  await app.close()
})

await app.listen({ host: config.host, port: config.port })
