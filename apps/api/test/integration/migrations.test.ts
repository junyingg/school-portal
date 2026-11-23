import { sql, type Kysely } from "kysely"
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest"
import {
  CLASSES_FORM_TEACHER_ID_KEY,
  TEACHERS_EMAIL_LOWER_KEY,
} from "../../src/db/constraintNames.ts"
import { createDatabase, type Database } from "../../src/db/database.ts"

const APP_TABLES = ["teachers", "classes"]
const GRANTED_PRIVILEGES = ["SELECT", "INSERT"]
const WITHHELD_PRIVILEGES = ["UPDATE", "DELETE", "TRUNCATE"]
const MIGRATION_TABLES = ["kysely_migration", "kysely_migration_lock"]
const MIGRATION_TABLE_PRIVILEGES = ["SELECT", "INSERT", "UPDATE", "DELETE"]
const INSUFFICIENT_PRIVILEGE = "42501"

let appDb: Kysely<Database>

beforeAll(() => {
  appDb = createDatabase({ connectionString: inject("appDatabaseUrl"), maxConnections: 1 })
})

afterAll(async () => {
  await appDb.destroy()
})

function everyPairOf(tables: string[], privileges: string[]): [string, string][] {
  return tables.flatMap((table) =>
    privileges.map((privilege): [string, string] => [table, privilege]),
  )
}

async function appRoleHasPrivilege(table: string, privilege: string): Promise<boolean> {
  const result = await sql<{
    allowed: boolean
  }>`select has_table_privilege(${table}, ${privilege}) as allowed`.execute(appDb)
  const [row] = result.rows
  if (row === undefined) {
    throw new Error("has_table_privilege returned no row")
  }
  return row.allowed
}

async function publicTableNames(): Promise<string[]> {
  const result = await sql<{
    tablename: string
  }>`select tablename from pg_tables where schemaname = 'public'`.execute(appDb)
  return result.rows.map((row) => row.tablename)
}

async function indexDefinition(indexName: string): Promise<string | undefined> {
  const result = await sql<{
    indexdef: string
  }>`select indexdef from pg_indexes where schemaname = 'public' and indexname = ${indexName}`.execute(
    appDb,
  )
  return result.rows[0]?.indexdef
}

describe("schema", () => {
  it("creates the teachers and classes tables", async () => {
    expect(await publicTableNames()).toEqual(expect.arrayContaining(APP_TABLES))
  })

  it("makes teacher email unique regardless of case", async () => {
    const definition = await indexDefinition(TEACHERS_EMAIL_LOWER_KEY)

    expect(definition).toContain("UNIQUE INDEX")
    expect(definition).toContain("lower(email)")
  })

  it("makes form_teacher_id unique across classes", async () => {
    const definition = await indexDefinition(CLASSES_FORM_TEACHER_ID_KEY)

    expect(definition).toContain("UNIQUE INDEX")
    expect(definition).toContain("(form_teacher_id)")
  })
})

describe("app role grants", () => {
  it.each(everyPairOf(APP_TABLES, GRANTED_PRIVILEGES))("allows %s %s", async (table, privilege) => {
    expect(await appRoleHasPrivilege(table, privilege)).toBe(true)
  })

  it.each(everyPairOf(APP_TABLES, WITHHELD_PRIVILEGES))(
    "withholds %s %s",
    async (table, privilege) => {
      expect(await appRoleHasPrivilege(table, privilege)).toBe(false)
    },
  )

  it.each(everyPairOf(MIGRATION_TABLES, MIGRATION_TABLE_PRIVILEGES))(
    "withholds %s %s",
    async (table, privilege) => {
      expect(await appRoleHasPrivilege(table, privilege)).toBe(false)
    },
  )

  it("cannot create a table", async () => {
    await expect(sql`create table intruder (id int)`.execute(appDb)).rejects.toMatchObject({
      code: INSUFFICIENT_PRIVILEGE,
    })
  })
})
