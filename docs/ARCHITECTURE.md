# Architecture

What the code does and where it lives. For why it is built this way, see [DECISIONS.md](DECISIONS.md).

```
Browser ──► nginx :8080 ─┬─ /      static web app (React, Ant Design)
                         └─ /api/  ──► API :3000 (Fastify) ──► PostgreSQL 18
                                       routes → handlers → services → repositories
```

The web app and the API share one origin through nginx. Both validate against one Zod contract in `packages/contract`.

## Packages and folders

| Path                               | Job                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/contract/`               | Zod schemas, field rules, option lists, error messages and the specification's examples, shared by the API, the web app, the OpenAPI generator and the Postman sync script      |
| `apps/api/`                        | Fastify API: HTTP plugins, routes, handlers, services, repositories, error mapping, migrations                                                                                  |
| `apps/web/`                        | React web app: pages, features, shared components, the Ant Design wrapper                                                                                                       |
| `postman/`                         | Postman collection and environment, run by Newman through `pnpm test:contract`; `scripts/syncSchemas.ts` copies JSON Schemas and messages from the contract into the collection |
| `e2e/`                             | Playwright tests against the running stack                                                                                                                                      |
| `docker/`                          | `api.Dockerfile`, `web.Dockerfile`, `nginx/default.conf`, `postgres/initdb/01-create-roles.sh`                                                                                  |
| `compose.yaml`, `compose.dev.yaml` | The full stack; the dev override publishes PostgreSQL on `127.0.0.1:5432`                                                                                                       |
| `scripts/initEnv.ts`               | Writes `.env` from `.env.example` with random database passwords                                                                                                                |
| `.github/`                         | CI workflow and Dependabot config                                                                                                                                               |

### `packages/contract/src`

| File               | Job                                                                                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`         | The package's public exports                                                                                                                                                                   |
| `fieldRules.ts`    | Building blocks: `requiredString`, `requiredText`, `personName`, `emailField`, `contactNumberField`, `listedValue`; length limits, patterns and the list messages                              |
| `teacher.ts`       | `createTeacherRequestSchema`, `teacherPathParamsSchema` (the email in `DELETE /api/teachers/{email}`), `teacherSchema`, `teacherListResponseSchema`                                            |
| `schoolClass.ts`   | `createClassRequestSchema`, `classPathParamsSchema` (the email in `DELETE /api/classes/{teacherEmail}`), `schoolClassSchema`, `formTeacherSchema` (`name`, `email`), `classListResponseSchema` |
| `optionLists.ts`   | `SUBJECTS` (nine) and `CLASS_LEVELS` (Primary 1–6)                                                                                                                                             |
| `errorMessages.ts` | Every fixed error message, `unknownTeacherEmailMessage(email)` and `noClassForTeacherMessage(email)`                                                                                           |
| `errorResponse.ts` | `errorResponseSchema`: `{ error: string }`                                                                                                                                                     |
| `examples.ts`      | The specification's example teachers, classes and requests, used as test fixtures                                                                                                              |

Response schemas are plain `z.object`s, so serialisation drops any key that is not in the specification.

### `apps/api/src`

| File or folder                                     | Job                                                                                                                                                                                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `server.ts`                                        | Entry point: loads config, creates the pool, builds the app, listens, and drains on shutdown with `close-with-grace`                                                                                                                                                   |
| `app.ts`                                           | `buildApp(dependencies)`: creates Fastify with a 16 KiB body limit and `x-request-id`, sets the Zod validator and serializer, registers the plugins and routes                                                                                                         |
| `composition.ts`                                   | `createServices(db)`: wires repositories into services                                                                                                                                                                                                                 |
| `config/env.ts`                                    | Validates the environment with Zod and fails fast with every problem listed                                                                                                                                                                                            |
| `config/limits.ts`                                 | `REQUEST_BODY_LIMIT_BYTES`                                                                                                                                                                                                                                             |
| `http/jsonOnlyPlugin.ts`                           | Removes Fastify's `text/plain` parser, so every non-JSON body is a 415                                                                                                                                                                                                 |
| `http/securityPlugin.ts`                           | Helmet with `default-src 'none'`, `Cache-Control: no-store`, and CORS only when `CORS_ALLOWED_ORIGINS` is set                                                                                                                                                          |
| `http/healthPlugin.ts`                             | `GET /healthz` and `GET /readyz` (hidden from the API document)                                                                                                                                                                                                        |
| `http/methodNotAllowed.ts`                         | JSON 405 with an `Allow` header; the unsupported methods are derived from the ones a path allows                                                                                                                                                                       |
| `http/apiErrorResponses.ts`                        | The error response schemas each route declares                                                                                                                                                                                                                         |
| `http/openApiPlugin.ts`, `http/openApiDocument.ts` | Generates `apps/api/openapi.json` from the route schemas (`scripts/writeOpenApi.ts`)                                                                                                                                                                                   |
| `errors/errorHandlerPlugin.ts`                     | The single error and not-found handler; logs server faults only                                                                                                                                                                                                        |
| `errors/errorMapper.ts`                            | `mapErrorToReply(error)`: validation → 400; domain errors → 400 (unknown `teacherEmail`), 404 (no such teacher or class) or 409 (teacher is a form teacher); Fastify body errors → 400/413/415; unique violation → 409; other 4xx → reason phrase; anything else → 500 |
| `errors/validationMessage.ts`                      | Joins the first message of each invalid field with `"; "`; a whole-body issue becomes "Request body must be a JSON object"                                                                                                                                             |
| `errors/postgresErrors.ts`                         | Recognises `23505` and maps the constraint name to a message; `isRestrictViolationOn` recognises `23001` on a named constraint                                                                                                                                         |
| `errors/domainErrors.ts`                           | `UnknownTeacherEmailError`, `TeacherNotFoundError`, `ClassNotFoundError`, `TeacherIsFormTeacherError`                                                                                                                                                                  |
| `modules/teachers/`                                | `teacherRoutes.ts`, `teacherHandlers.ts`, `teacherService.ts`, `teacherRepository.ts`, `teacherMapper.ts`                                                                                                                                                              |
| `modules/classes/`                                 | `classRoutes.ts`, `classHandlers.ts`, `classService.ts`, `classRepository.ts`, `classMapper.ts`                                                                                                                                                                        |
| `db/database.ts`                                   | Table types and `createDatabase` (a Kysely instance over a `pg` pool)                                                                                                                                                                                                  |
| `db/teacherEmail.ts`                               | `teacherHasEmail(email)`: the case-insensitive `lower(email) = lower($1)` condition both repositories use                                                                                                                                                              |
| `db/migrations/`                                   | `0001_create_teachers_and_classes.ts`, `0002_grant_app_delete.ts` and the static `index.ts` list                                                                                                                                                                       |
| `db/migrator.ts`, `db/migrate.ts`                  | Runs the migrations; `migrate.ts` is the command the `migrate` container runs                                                                                                                                                                                          |
| `db/readiness.ts`                                  | `select 1`, failing once the server starts draining                                                                                                                                                                                                                    |
| `db/constraintNames.ts`                            | The two unique-constraint names the error mapper relies on                                                                                                                                                                                                             |

Each layer has one job. Routes declare the path and the Zod schemas. Handlers turn a request into a service call and set the status. Services hold the rules and call repositories. Repositories hold the queries. `eslint.config.ts` enforces the direction.

### `apps/web/src`

| File or folder                                                      | Job                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`, `configureZod.ts`                                       | Entry point; puts Zod in `jitless` mode so the CSP needs no `unsafe-eval`                                                                                                                                                                                                         |
| `App.tsx`, `routes.tsx`, `routePaths.ts`                            | Query client, theme and router; five routes under one layout (`/` redirects to `/classes`; unknown paths show `NotFoundPage`)                                                                                                                                                     |
| `api/`                                                              | `apiClient.ts` (`getJson`, `postJson`, `deleteResource`), `ApiError.ts`, `teachersApi.ts`, `classesApi.ts`, `queryKeys.ts`. No React here (lint-enforced)                                                                                                                         |
| `features/teachers/`                                                | `TeacherForm.tsx`, `TeacherTable.tsx`, `DeleteTeacherDialog.tsx`, `teacherFormSchema.ts`, `teacherFieldMessages.ts`, `teacherDeleteCopy.ts`, `teacherServerErrors.ts`, `formatContactNumber.ts`, `useTeachers.ts`, `useCreateTeacher.ts`, `useDeleteTeacher.ts`                   |
| `features/classes/`                                                 | `ClassForm.tsx`, `ClassTable.tsx`, `DeleteClassDialog.tsx`, `FormTeacherSelect.tsx`, `classFormSchema.ts`, `classFieldMessages.ts`, `classDeleteCopy.ts`, `classServerErrors.ts`, `teacherOptions.ts`, `classDraft.ts`, `useClasses.ts`, `useCreateClass.ts`, `useDeleteClass.ts` |
| `features/serverErrorPresentation.ts`, `features/selectionRules.ts` | Shared by both features: the field-or-banner error type, and "nothing selected yet"                                                                                                                                                                                               |
| `components/`                                                       | Shared building blocks: `ListPage.tsx`, `FormShell.tsx`, `FormActions.tsx`, `ControlledTextInput.tsx`, `ControlledSelect.tsx`, `EmptyState.tsx`, `LoadErrorState.tsx`, `PageHeader.tsx`, `fieldIds.ts`                                                                            |
| `components/ui/`                                                    | The only place that imports `antd`: `Button`, `IconButton`, `Card`, `ConfirmDialog`, `DataTable`, `ErrorBanner`, `FormField`, `FormLayout`, `LoadingState`, `SelectInput`, `TextInput`, `ThemeProvider`, `theme.ts`, `icons.tsx`                                                  |
| `hooks/`                                                            | `useSubmitThenReturn.ts`, `useFocusFieldOnServerError.ts`, `useFocusHeadingOnNavigate.ts`                                                                                                                                                                                         |
| `shell/`                                                            | `AppLayout.tsx`, `TopNav.tsx`, `NavTab.tsx`, `activeTab.ts`                                                                                                                                                                                                                       |
| `pages/`                                                            | `TeachersPage.tsx`, `AddTeacherPage.tsx`, `ClassesPage.tsx`, `AddClassPage.tsx`, `NotFoundPage.tsx`                                                                                                                                                                               |
| `test/`                                                             | `setup.ts`, `renderWithProviders.tsx`, `designFixtures.ts`, `msw/handlers.ts`, `msw/server.ts`                                                                                                                                                                                    |

## One request end to end: `POST /api/classes`

```json
{ "level": "Primary 1", "name": "Class 1A", "teacherEmail": "teachermary@gmail.com" }
```

1. **nginx** (`docker/nginx/default.conf`, `location /api/`). `limit_req` allows 50 requests a second per address with a burst of 200; beyond that it answers `429 {"error":"Too many requests"}`. A body over 1 MiB gets nginx's JSON 413. Otherwise it proxies to `http://api:3000`, setting `X-Request-Id` to its own `$request_id`. If the API is down or slow, nginx answers 502, 503 or 504 with `{"error":"Service unavailable"}`.
2. **Fastify** (`apps/api/src/app.ts`). The request id from nginx becomes the log id. A body over 16 KiB is rejected with `FST_ERR_CTP_BODY_TOO_LARGE`. `jsonOnlyPlugin` has removed the `text/plain` parser, so any `Content-Type` other than JSON fails with `FST_ERR_CTP_INVALID_MEDIA_TYPE`. Malformed JSON fails with `FST_ERR_CTP_INVALID_JSON_BODY`.
3. **Route and validation** (`modules/classes/classRoutes.ts`). The route declares `body: createClassRequestSchema`. The Zod validator from `fastify-type-provider-zod` trims each field, checks `level` against Primary 1–6, `name` for 1–50 characters, and `teacherEmail` for a simple email shape, and drops unknown keys. A failure carries a `validation` array of issues.
4. **Handler** (`classHandlers.ts`). `addClass` passes the parsed body to the service and replies 201 with the result.
5. **Service** (`classService.ts`). `addClass` calls `teacherRepository.findByEmail`. No teacher → it throws `UnknownTeacherEmailError`. Otherwise it calls `classRepository.insert` with the teacher's id and returns `toSchoolClass(…)`: level, name and `formTeacher: { name, email }`, with the email as stored.
6. **Repositories** (`teacherRepository.ts`, `classRepository.ts`). Kysely builds parameterised SQL: `select … from teachers where lower(email) = lower($1)`, which uses the unique `lower(email)` index, then `insert into classes (level, name, form_teacher_id) values ($1, $2, $3)`.
7. **PostgreSQL.** The unique constraint `classes_form_teacher_id_key` decides the form-teacher rule, even when two requests race. A second class for the same teacher fails with SQLSTATE `23505` and that constraint name.
8. **Serialisation.** On success, Fastify serialises the result through `schoolClassSchema`, so only `level`, `name` and `formTeacher` (`name`, then `email`) leave the server, in that order. `securityPlugin` adds Helmet's headers and `Cache-Control: no-store`.
9. **Error mapper** (`errors/errorHandlerPlugin.ts` → `errors/errorMapper.ts`). Any thrown error lands here:

| Error                                                                            | Reply                                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Validation issues                                                                | 400, the first message per field joined with `"; "` (`validationMessage.ts`); a non-object body gives "Request body must be a JSON object" |
| `UnknownTeacherEmailError`                                                       | 400 `No teacher found with email <email>`                                                                                                  |
| `FST_ERR_CTP_INVALID_JSON_BODY`, `…_EMPTY_JSON_BODY`, `…_INVALID_CONTENT_LENGTH` | 400 with a fixed message                                                                                                                   |
| `FST_ERR_CTP_BODY_TOO_LARGE`                                                     | 413 `Request body too large`                                                                                                               |
| `FST_ERR_CTP_INVALID_MEDIA_TYPE`                                                 | 415 `Content-Type must be application/json`                                                                                                |
| `23505` on `classes_form_teacher_id_key`                                         | 409 `Teacher is already the form teacher of another class`                                                                                 |
| `23505` on `teachers_email_lower_key`                                            | 409 `A teacher with this email already exists`                                                                                             |
| Any other error with a 4xx `statusCode`                                          | that status, with its reason phrase                                                                                                        |
| Any other error                                                                  | 500 `Internal server error`, logged with the request id                                                                                    |

Every reply is `{ "error": "…" }`. Only 500s are logged as errors, so client mistakes do not fill the error log. Unknown routes get a JSON 404 from the not-found handler, and a method a path does not allow gets the JSON 405 from `methodNotAllowed.ts`.

## Deleting: `DELETE /api/teachers/{email}`

1. **Route** (`teacherRoutes.ts`). `params: teacherPathParamsSchema` trims the email from the path and checks its format; a malformed one is a 400.
2. **Service** (`teacherService.ts`). `deleteTeacher` calls `teacherRepository.deleteByEmail`. If no row was deleted, it throws `TeacherNotFoundError` (404 `No teacher found with email <email>`).
3. **Repository** (`teacherRepository.ts`). `delete from teachers where lower(email) = lower($1)`. If the teacher is still a form teacher, the `ON DELETE RESTRICT` key `classes_form_teacher_id_fkey` makes PostgreSQL refuse with `23001`; the repository turns that into `TeacherIsFormTeacherError` (409).
4. **Reply.** `204 No Content` with no body.

`DELETE /api/classes/{teacherEmail}` follows the same path: `classRepository.deleteByFormTeacherEmail` runs `delete from classes where form_teacher_id in (select id from teachers where lower(email) = lower($1))`, and no deleted row is `ClassNotFoundError` (404 `No class found with form teacher email <email>`). Class responses carry `formTeacher.email` so a client knows what to send.

## The web app

### Loading data

`useTeachers` and `useClasses` are TanStack Query hooks keyed by `queryKeys.teachers` and `queryKeys.classes`. They call `fetchTeachers` and `fetchClasses`, which use `getJson` in `api/apiClient.ts`. The client parses every response with the contract's schema, so a body that does not match the specification becomes an `ApiError` instead of bad data on screen. An error body is parsed with `errorResponseSchema`; anything unparseable, and any network failure, becomes the generic "Something went wrong. Please try again."

`components/ListPage.tsx` renders one list page from a query and a copy object (`TeachersPage.tsx`, `ClassesPage.tsx`):

| Query state | Card                                                            | Header     |
| ----------- | --------------------------------------------------------------- | ---------- |
| Loading     | `LoadingState`, card marked `aria-busy`                         | Add button |
| Load error  | `LoadErrorState` with Retry                                     | Add button |
| Empty       | `EmptyState`: "There are no existing … yet." and the Add button | no button  |
| Items       | `TeacherTable` or `ClassTable` through `DataTable`              | Add button |

`DataTable` numbers rows from 1 and sits in a focusable scroll region, so a narrow screen scrolls the table, not the page. Both tables end with an unlabelled column holding a delete icon button per row (`IconButton` with `DeleteIcon`, in `components/ui/`), named "Delete <name>" for screen readers; the header cell is named "Actions" through `aria-label` (`DataColumn.isTitleHidden`). `TeacherTable` shows contact numbers as `6736 3939` (`formatContactNumber.ts`).

### Forms

`TeacherForm` and `ClassForm` use React Hook Form with `zodResolver` and a form schema of their own (`teacherFormSchema.ts`, `classFormSchema.ts`). The form schemas reuse the contract's limits, patterns and option lists, but carry the designs' messages ("This email address is invalid.") instead of the API's ("email must be a valid email address"). The teacher form strips spaces from the contact number and requires `^6\d{7}$`. Subject and level are selects over `SUBJECTS` and `CLASS_LEVELS`.

`FormShell` wraps each form in a native `<form noValidate>`, a card, an optional error banner and the Back and submit buttons. `ControlledTextInput` and `ControlledSelect` connect a field to React Hook Form and pass `id`, `aria-invalid`, `aria-required` and `aria-describedby` to the antd control. The submit button shows "Adding..." and is disabled while the request runs.

`FormTeacherSelect` loads the teachers and offers names only; it adds the email when two teachers share a name (`teacherOptions.ts`). With no teachers, it shows "No existing teachers." and an "Add a teacher" link under the closed select, and the same panel inside the open dropdown.

### Showing server errors

`AddTeacherPage` and `AddClassPage` run the mutation (`useCreateTeacher`, `useCreateClass`) through `useSubmitThenReturn`, which navigates back to the list only on success. On failure, `presentTeacherServerError` or `presentClassServerError` compares the API's message with the contract's constant:

| API message                                            | Shown                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `A teacher with this email already exists`             | "This email address is already registered." under Email Address                 |
| `Teacher is already the form teacher of another class` | "This teacher is already the form teacher of another class." under Form Teacher |
| `No teacher found with email <the email sent>`         | "This form teacher could not be found." under Form Teacher                      |
| anything else                                          | the API's message in an error banner above the buttons                          |

`useFocusFieldOnServerError` moves focus to the field with the server error. Editing that field clears it. A successful create invalidates the list query, so the list refetches.

### Deleting from the tables

`TeachersPage` and `ClassesPage` keep the row being deleted in state and render `DeleteTeacherDialog` or `DeleteClassDialog` for it. Each dialog is a `ConfirmDialog` (antd `Modal`). Confirming runs `useDeleteTeacher` or `useDeleteClass` (`deleteResource` in `api/apiClient.ts`, which expects a `204`); the list refetches whether the delete succeeds or fails. A refusal stays in the dialog: `presentTeacherDeleteError` and `presentClassDeleteError` turn the API's 409 and 404 messages into the designs' voice, and anything else shows the API's message.

### Navigation and the Add Class draft

`TopNav` marks the current tab with `aria-current="page"` from the first path segment (`activeTab.ts`). `PageHeader` focuses the page's `<h1>` after each navigation, for screen readers. The "Add a teacher" link opens Add Teacher with `returnTo: /classes/new`, so saving or going back returns to Add Class. `classDraft.ts` keeps the Add Class values in `sessionStorage` for an hour, so they survive that round trip. The draft is cleared after a successful save or an explicit Back.

## Database schema and roles

Migration `apps/api/src/db/migrations/0001_create_teachers_and_classes.ts`:

```sql
create table teachers (
  id integer generated always as identity,
  name text not null,
  subject text not null,
  email text not null,
  contact_number text not null,
  constraint teachers_pkey primary key (id)
);
create unique index teachers_email_lower_key on teachers (lower(email));

create table classes (
  id integer generated always as identity,
  level text not null,
  name text not null,
  form_teacher_id integer not null,
  constraint classes_pkey primary key (id),
  constraint classes_form_teacher_id_fkey
    foreign key (form_teacher_id) references teachers (id) on delete restrict,
  constraint classes_form_teacher_id_key unique (form_teacher_id)
);

grant select, insert on teachers, classes to school_portal_app;
-- migration 0002_grant_app_delete.ts:
grant delete on teachers, classes to school_portal_app;
```

- `id` orders lists by insertion and never leaves the API.
- Email is stored as sent; uniqueness ignores case through the `lower(email)` index.
- `classes_form_teacher_id_key` is the form-teacher rule; `constraintNames.ts` holds both names for the error mapper.
- Length limits are enforced by the contract at the API edge, not by the columns.

| Role                         | Created by                                  | Can                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postgres` (`POSTGRES_USER`) | the PostgreSQL image                        | bootstrap only; the API and the migrator never use it                                                                                                                                                    |
| `school_portal_migrator`     | `docker/postgres/initdb/01-create-roles.sh` | owns the database and schema `public`; runs migrations through `MIGRATION_DATABASE_URL`                                                                                                                  |
| `school_portal_app`          | the same script                             | `CONNECT` and `USAGE` on `public` from the script; `SELECT` and `INSERT` on both tables from migration `0001`, `DELETE` from `0002`; no `UPDATE`, `TRUNCATE`, DDL or access to Kysely's migration tables |

The init script runs only when the data volume is first created. In `compose.yaml`, the `migrate` service (`node dist/db/migrate.js`) runs once after PostgreSQL is healthy, and the API starts only after it completes. The passwords come from `.env`, which `pnpm env:init` writes with mode `0600`.

## Where the tests live

| Layer           | Files                                                                                                                                                                                                                                          | Run with                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Contract unit   | `packages/contract/src/*.test.ts`                                                                                                                                                                                                              | `pnpm test:unit`        |
| API unit        | `apps/api/src/**/*.test.ts`: services with in-memory fakes, the error mapper, the message joiner, env config, the OpenAPI document, and `app.test.ts` (HTTP plumbing through `inject()` with fake services)                                    | `pnpm test:unit`        |
| Web unit        | `apps/web/src/**/*.test.ts`: form schemas, server-error mapping, option labels, the draft store, the API client, the active tab                                                                                                                | `pnpm test:unit`        |
| Web component   | `apps/web/src/**/*.test.tsx`: every page, form and table with the API faked by MSW (`test/msw/`); `onUnhandledFrame: "error"` fails a test on any unmocked request                                                                             | `pnpm test:component`   |
| API integration | `apps/api/test/integration/*.test.ts`: a real PostgreSQL 18 per run from Testcontainers (`globalSetup.ts` copies in the roles script and migrates), queried as the app role; `support/` holds the app builder, request helpers and table reset | `pnpm test:integration` |
| Contract (HTTP) | `postman/school-portal.postman_collection.json`, run by Newman through nginx                                                                                                                                                                   | `pnpm test:contract`    |
| End to end      | `e2e/tests/*.spec.ts`: teacher and class flows, the form-teacher conflict, the Add Class draft, a 320 px layout, axe scans; `e2e/support/` holds locators and unique test data                                                                 | `pnpm test:e2e`         |

`vitest.config.ts` defines the five Vitest projects and the coverage thresholds that `pnpm test:coverage` enforces. Unit and component tests need nothing running; integration needs Docker; contract and end-to-end tests need `pnpm stack:up`.
