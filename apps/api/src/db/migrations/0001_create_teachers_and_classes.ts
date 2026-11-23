import { sql, type Kysely } from "kysely"

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`
    create table teachers (
      id integer generated always as identity,
      name text not null,
      subject text not null,
      email text not null,
      contact_number text not null,
      constraint teachers_pkey primary key (id)
    )
  `.execute(db)

  await sql`create unique index teachers_email_lower_key on teachers (lower(email))`.execute(db)

  await sql`
    create table classes (
      id integer generated always as identity,
      level text not null,
      name text not null,
      form_teacher_id integer not null,
      constraint classes_pkey primary key (id),
      constraint classes_form_teacher_id_fkey
        foreign key (form_teacher_id) references teachers (id) on delete restrict,
      constraint classes_form_teacher_id_key unique (form_teacher_id)
    )
  `.execute(db)

  await sql`grant select, insert on teachers, classes to school_portal_app`.execute(db)
}
