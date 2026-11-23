import closeWithGrace from "close-with-grace"
import { buildApp } from "./app.ts"
import { createServices } from "./composition.ts"
import { loadConfig } from "./config/env.ts"
import { createDatabase } from "./db/database.ts"

const SHUTDOWN_GRACE_PERIOD_MS = 10_000

const config = loadConfig(process.env)
const db = createDatabase({
  connectionString: config.databaseUrl,
  maxConnections: config.dbPoolMax,
})
const app = await buildApp({ config, services: createServices(db) })

closeWithGrace({ delay: SHUTDOWN_GRACE_PERIOD_MS }, async ({ err }) => {
  if (err !== undefined) {
    app.log.error({ err }, "Shutting down after an uncaught error")
  }
  await app.close()
  await db.destroy()
})

await app.listen({ host: config.host, port: config.port })
