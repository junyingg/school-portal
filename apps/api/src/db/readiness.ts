import { sql, type Kysely } from "kysely"
import type { Database } from "./database.ts"

export interface ReadinessProbe {
  readonly check: () => Promise<void>
  readonly markDraining: () => void
}

export function createReadinessProbe(db: Kysely<Database>): ReadinessProbe {
  let isDraining = false
  return {
    async check() {
      if (isDraining) {
        throw new Error("The server is draining before shutdown")
      }
      await sql`select 1`.execute(db)
    },
    markDraining() {
      isDraining = true
    },
  }
}
