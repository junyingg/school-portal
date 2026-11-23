import type { FastifyInstance } from "fastify"
import { inject } from "vitest"
import { buildApp } from "../../../src/app.ts"
import { createServices } from "../../../src/composition.ts"
import { createDatabase } from "../../../src/db/database.ts"

const TEST_POOL_SIZE = 10

export interface TestApp {
  readonly app: FastifyInstance
  readonly close: () => Promise<void>
}

export async function buildTestApp(): Promise<TestApp> {
  const db = createDatabase({
    connectionString: inject("appDatabaseUrl"),
    maxConnections: TEST_POOL_SIZE,
  })
  const app = await buildApp({ config: { logLevel: "silent" }, services: createServices(db) })
  return {
    app,
    close: async () => {
      await app.close()
      await db.destroy()
    },
  }
}
