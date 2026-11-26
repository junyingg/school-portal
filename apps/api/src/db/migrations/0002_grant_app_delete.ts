import { sql, type Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`grant delete on teachers, classes to school_portal_app`.execute(db)
}
