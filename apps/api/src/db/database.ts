import { Kysely, PostgresDialect, type GeneratedAlways } from "kysely"
import pg from "pg"

export interface TeachersTable {
  id: GeneratedAlways<number>
  name: string
  subject: string
  email: string
  contact_number: string
}

export interface ClassesTable {
  id: GeneratedAlways<number>
  level: string
  name: string
  form_teacher_id: number
}

export interface Database {
  teachers: TeachersTable
  classes: ClassesTable
}

export interface DatabaseConnectionOptions {
  readonly connectionString: string
  readonly maxConnections: number
}

export function createDatabase(options: DatabaseConnectionOptions): Kysely<Database> {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    max: options.maxConnections,
  })
  return new Kysely<Database>({ dialect: new PostgresDialect({ pool }) })
}
