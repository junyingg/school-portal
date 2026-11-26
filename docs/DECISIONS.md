# Decisions

Why the stack, the repository layout and the validation rules are what they are, with the alternatives that were weighed. For what the code does, see [ARCHITECTURE.md](ARCHITECTURE.md); for how each requirement is met, see [REQUIREMENTS.md](REQUIREMENTS.md).

## 1. Constraints and goals

**Fixed by the brief**

- One language across frontend and backend (TypeScript or JavaScript), a Node.js backend and a React frontend.
- A relational database is strongly recommended: PostgreSQL, MySQL or MariaDB.
- The API may be exercised by automated test tools, so it must follow the given request and response examples closely.
- The screens need the same user flows and input controls as the designs, not pixel-perfect copies.

**Chosen**

- TypeScript everywhere: types catch mistakes before tests run, and one schema can describe the data on both sides.
- PostgreSQL.

**Goals**

- Readable code, secure defaults, and a modular structure that is easy to test.
- Room to scale horizontally (more instances) and vertically (bigger instances), and a simple path to redundancy.
- Tests written before the code, at every layer from single rules to a browser.

**The tension behind most choices.** The app is small — four endpoints in the brief (six with the later deletes), five screens — and is meant to be read. So scalability lives in the architecture and deployment (a stateless API, a connection pool, health checks, rules enforced by the database), not in heavy frameworks. Anything that adds ceremony without paying for itself at this size was left out.

Versions were read from the npm registry and nodejs.org on the day they were chosen, and peer-dependency ranges were checked, because they decide which versions can coexist.

## 2. The stack

| Area                    | Chosen                                                                                 | Considered                                         | Why                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime                 | Node.js 26 LTS, pinned to 26.13.1; Node 24 also supported                              | Node 24 only                                       | 26 has the longest support window. `engines` accepts 24–26, and CI's static job runs both.                                                                                                                                                                                                                                                                                            |
| Repository              | pnpm workspaces: `apps/api`, `apps/web`, `packages/contract`, plus `e2e` and `postman` | Separate repositories; Turborepo or Nx             | One repository keeps the shared contract in step with both apps. Three packages are too few for build caching to pay off. pnpm's strict `node_modules` stops accidental imports between packages.                                                                                                                                                                                     |
| HTTP framework          | Fastify 5                                                                              | Express 5, NestJS, Hono                            | Built-in body limits, media-type rejection, JSON logging, and `inject()` to test HTTP without opening a port. NestJS's modules and decorators are ceremony for four endpoints. Express needs more add-ons for the same safety. Hono runs on Node through an adapter with fewer Node plugins.                                                                                          |
| Data access             | Kysely + `pg`                                                                          | Prisma, Drizzle, TypeORM, raw `pg`                 | Reads like SQL, is always parameterised, and types come from a small hand-written interface. It passes PostgreSQL's errors through unchanged, so a unique violation (`23505`) and its constraint name map straight to a precise 409. Drizzle wraps driver errors in a message that contains the SQL and its parameters, which risks leaking data. Prisma adds a code-generation step. |
| Validation and contract | Zod 4 in a shared package, with `fastify-type-provider-zod`                            | TypeBox; separate validation per side              | One schema drives request validation, response serialisation, the OpenAPI document, the Postman JSON Schemas and test fixtures. The response serialiser drops unknown keys, so a response cannot leak `id` or timestamps.                                                                                                                                                             |
| Frontend                | Vite, React 19, React Router, TanStack Query, React Hook Form                          | Next.js; TanStack Router; hand-written fetch hooks | No server rendering is needed. Vite's dev proxy removes CORS during development. TanStack Query gives loading and error states and refetches a list after a create.                                                                                                                                                                                                                   |
| UI library              | Ant Design 6, themed                                                                   | MUI                                                | See § 4.                                                                                                                                                                                                                                                                                                                                                                              |
| Tests                   | Vitest, React Testing Library, MSW, Testcontainers, Newman, Playwright                 | Jest; a shared database for tests; the Postman CLI | Each tool owns one layer (§ 7). Only a real PostgreSQL per run can prove constraints and races.                                                                                                                                                                                                                                                                                       |
| Lint and types          | ESLint 10 + typescript-eslint, Prettier, TypeScript 6                                  | Biome; TypeScript 7                                | Type-aware lint rules catch unsafe code. TypeScript 7 was outside typescript-eslint's supported range when chosen.                                                                                                                                                                                                                                                                    |
| Database                | PostgreSQL 18                                                                          | PostgreSQL 19                                      | 19.0 had shipped the day before; too new to trust.                                                                                                                                                                                                                                                                                                                                    |

**Supply chain.** New package releases wait a day before install (`minimumReleaseAge`), dependency install scripts are blocked unless allow-listed (`strictDepBuilds`), and CI fails on high-severity advisories in production dependencies (`pnpm audit:prod`). The full audit runs too but does not block, because the remaining advisories sit in two dev-only test tools.

## 3. Repository structure

| Decision                                                                                                                     | Considered                             | Why                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A shared `packages/contract` that depends only on Zod                                                                        | Duplicated types and rules in each app | One rule, one place: the form, the API, the OpenAPI document and the Postman collection cannot drift apart. A lint rule stops the contract importing anything else.                   |
| API layers: routes → handlers → services → repositories → database                                                           | Fat route handlers                     | Each layer has one job. Services hold the business rules and are tested with in-memory fakes, without a database.                                                                     |
| Layer boundaries enforced by `no-restricted-imports` in `eslint.config.ts`                                                   | Convention only                        | The structure is checked on every lint run: services cannot import Fastify, Kysely, `pg` or `db/`; handlers cannot import repositories; error handling cannot import feature modules. |
| `buildApp(dependencies)` factory with services passed in                                                                     | A module-level singleton app           | Tests build the app with fakes (unit) or with a real database (integration); the OpenAPI generator builds it with placeholder services that always fail.                              |
| Every `antd` import lives in `apps/web/src/components/ui/`, enforced by lint                                                 | Import antd anywhere                   | The UI library can be swapped by rewriting one folder. Features and pages use small wrappers such as `Button`, `SelectInput` and `DataTable`.                                         |
| Web folders: `api/` (no React), `features/` (one folder per domain), `components/` (shared, no features), `pages/`, `shell/` | Folders by file type                   | A feature's schema, messages, hooks and components sit together; lint stops shared components depending on features or pages.                                                         |
| A static list of migrations (`db/migrations/index.ts`)                                                                       | Discover migration files at run time   | Works the same from source and from the compiled Docker image.                                                                                                                        |
| Small files named for what they do; named constants for every limit and message; no comments in code                         | Comment-heavy code                     | The code has to carry its own meaning; messages that tests assert on are constants, not repeated strings.                                                                             |

## 4. The UI library: chosen against the designs

The first stack pass picked MUI provisionally. Once the design frames were exported, their colours and layout were sampled:

- The brand blue (`#135bb4`), text (`#333`) and error red (`#e22c3b`) matched neither library's defaults, so it is a custom theme either way.
- Labels above inputs, placeholders inside selects and a thin chevron match Ant Design; MUI defaults to floating labels.
- The table-in-a-card and divider colour lean Ant Design; the shadowed card and tab spacing lean MUI.

**Decision: Ant Design 6 with theme tokens**, about a 55/45 call, kept reversible by confining antd to `components/ui/`. Placeholder and border colours are darker than the designs because the designs' greys fail WCAG AA contrast.

Two antd details shaped the wrappers:

- antd's `Form component={false}` drops `noValidate` and `onSubmit`, and an unnamed `Form.Item` wires no label. So forms are a native `<form noValidate>`, with `htmlFor`, `id` and `aria-describedby` passed explicitly.
- antd renders `notFoundContent` inside the option list's `role="listbox"`, which put the "Add a teacher" link inside a listbox and greyed the text to 1.83:1 contrast. The no-teachers panel is rendered through `popupRender` instead.

## 5. Validation rules

The specification gives request examples but no field rules. The designs add some: a documentation card lists the nine subjects and Primary 1–6, and one error frame marks `teacher@gov.sg` and `9283 9999` as invalid.

### Response shape: exactly the specification's

| Rule                                                                                                                                                                   | Considered                    | Why                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Responses contain only the specification's fields, in its key order; no `id` or timestamps. One later exception: `formTeacher` also carries the teacher's email (§ 12) | Add `id` and timestamps       | A tool that compares whole bodies would fail on extra fields.                                                  |
| An empty list is `{"data": []}`; lists are in insertion order                                                                                                          | —                             | Matches the examples' shape; insertion order is the order the examples show.                                   |
| `POST` returns `201` with the created item, flat                                                                                                                       | An empty `201`; `{"data": …}` | The specification gives no body; returning the item helps clients and cannot fail a status check.              |
| Unknown request fields are dropped                                                                                                                                     | Reject them with `400`        | Cannot fail a client that sends extras, and still prevents mass assignment because only known fields are kept. |

### D1 — how strict the API is

This decision moved the most, because two goals pull against each other: following the specification's examples, and enforcing the design's rules so the API cannot store what the form would refuse.

1. **API lenient, form strict.** The failure is asymmetric: if the API rejects a value an automated client chose — an unlisted subject, a 9-prefixed number — that teacher's `POST` fails and so does every class request that needs the teacher.
2. **Both strict.** Enforcing the design's rules at the API too gives one rule set, an API that cannot be bypassed with `curl`, allow-list validation, and clean data.
3. **Lists strict, the leading 6 in the form only.** (The contact rule changed again later; see § 12.) The rules have different strength of evidence. The subject and level lists are written in the designs' documentation card. The "starts with 6" contact rule is inferred from a single error frame, so it is the likeliest rule to be wrong, and it stays out of the API.

**In force:**

| Field          | API                                                 | Form                                 |
| -------------- | --------------------------------------------------- | ------------------------------------ |
| Subject        | one of the nine, exact match after trimming         | a select with the nine               |
| Level          | Primary 1–6, exact match after trimming             | a select with the six                |
| Contact number | trimmed, then `^[689]\d{7}$`; inner spaces rejected | spaces stripped, then `^[689]\d{7}$` |

A later change loosened this: the API accepted any subject or level up to a length limit and stripped inner spaces, and the form dropped the leading-6 rule. A review against the designs reversed it. With the looser form, the designs' own error example (`9283 9999`) was accepted, and the change contradicted the recorded decision without new evidence. The strict rules were restored, test first. The 400 message lists the allowed values, and `openapi.json` now lists them as an `enum` too.

| For enforcing the lists in the API                             | Against                                                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| The form and the API accept and reject exactly the same values | The specification's text states none of these rules                                                      |
| A direct API call cannot store a value the form would refuse   | A client sending an unlisted subject or level gets 400, and its class requests for that teacher fail too |
| Allow-list validation is the safer kind                        | A new subject or level needs a code change and a deploy                                                  |
| Reports by subject or level never meet typos                   | Exact matching is strict: `mathematics` is rejected                                                      |

Loosening is a change to `packages/contract/src/fieldRules.ts` and `packages/contract/src/optionLists.ts` only.

### D2 — email: a simple format check

`local@domain.tld`, in the form and the API. The designs mark `teacher@gov.sg` invalid; a rule exists that explains it (`gov.sg` is a public suffix, not a registrable domain), but the frame may only be illustrating an error, and enforcing it needs an extra library. `teacher@gov.sg` is accepted, and the README says so.

### D3 — a class's level and name are not unique

The specification's only class rule is "a teacher can only be the form teacher of one class". A uniqueness rule on (level, name) would make a re-run of the specification's `Primary 1` / `Class 1A` example with a new teacher fail with 409. Dropping it also removed a case where two unique constraints could fail at once and PostgreSQL does not say which it reports.

### One message per field

Each invalid field reports its first problem; several fields are joined with `"; "`. Zod 4 runs length checks on any input that has a `length`, so an array sent as `email` used to report both "email must be a string" and "email is required". The error formatter now keeps the first message per field path.

## 6. Errors and HTTP behaviour

| Decision                                                                                                                                | Why                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One error mapper turns every failure into `{ "error": "…" }` with a status                                                              | The specification requires that shape for every error; one place means one behaviour.                                                                                                    |
| 400 for input faults, including an unknown `teacherEmail`                                                                               | The bad value is in the request body, not the URL, so it is not a 404.                                                                                                                   |
| 409 for a duplicate email and for a teacher who is already a form teacher                                                               | 409 is the standard status for "conflicts with the current state".                                                                                                                       |
| 413 over the body limit, 415 for a non-JSON `Content-Type`, JSON 404 and 405                                                            | Each has a standard status; the README lists every case and message.                                                                                                                     |
| Stack traces and SQL are logged with a request id, never returned                                                                       | Errors must not leak internals; a 500 says only "Internal server error".                                                                                                                 |
| nginx also answers in JSON: 413 over 1 MiB, 429, 502–504                                                                                | Clients reach the API through nginx, so nginx's own errors must have the same shape. `charset=utf-8` is set explicitly because nginx's default `charset_types` omits `application/json`. |
| **D4** — rate limiting in nginx (`limit_req`, 50 requests a second per address, burst 200), none in the app                             | An app-level limiter behind a proxy sees one address unless `trustProxy` is configured, and per-process counters break horizontal scaling.                                               |
| Uniqueness lives in the database: a unique index on `lower(email)` and a unique `form_teacher_id`; `23505` is mapped by constraint name | A check-then-insert in code races when two requests arrive together. A test fires ten requests at once and expects exactly one 201.                                                      |
| API responses send `Cache-Control: no-store`                                                                                            | They contain teacher contact details.                                                                                                                                                    |

## 7. Testing: five layers

| Layer       | Tool                                                                        | Proves                                                                                                                           | Why this layer                                                         |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Unit        | Vitest                                                                      | Each field rule at its boundaries, the error mapper, services with in-memory fakes, env config, HTTP plumbing through `inject()` | Cheapest; table-driven boundary tests                                  |
| Component   | React Testing Library + MSW                                                 | Each screen's states, copy, field errors and navigation                                                                          | No backend; queries by role and label double as an accessibility check |
| Integration | Vitest + `inject()` + Testcontainers PostgreSQL, as the restricted app role | Exact bodies and key order, constraint mapping, case-insensitive email, role grants, ten-way races                               | Only a real database proves constraints and races                      |
| Contract    | Postman collection run by Newman through nginx                              | What an external client sees: statuses, JSON content type, JSON Schemas generated from the contract, nginx's JSON errors         | The brief invites a Postman collection                                 |
| End to end  | Playwright against the Docker stack                                         | The main flows in a real browser, responsive widths, and axe accessibility scans                                                 | Proves the whole stack together                                        |

Each fact is owned by the cheapest layer that can fail for the real reason; higher layers carry a representative case, not the whole boundary table. Behaviour changes are committed as a failing test first, then the code that passes it, so the history shows each red-then-green step.

## 8. Running, scaling and redundancy

| Property                   | How the code allows it                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One-command start          | `pnpm env:init` generates database passwords (the PostgreSQL image refuses an empty one); `pnpm stack:up` builds and starts everything behind nginx on one origin, so no CORS is needed.                  |
| Horizontal scaling         | The API is stateless: no sessions, caches or counters in memory. Any number of instances can run behind a load balancer.                                                                                  |
| Correctness at N instances | Invariants live in the database, not in check-then-insert code.                                                                                                                                           |
| Connection limits          | One pool per process, sized by `DB_POOL_MAX`; total connections = instances × pool size. PgBouncer in transaction mode is safe because `pg` uses unnamed statements.                                      |
| Safe deploys               | Migrations run as a separate step, never on start-up, so several instances never race to migrate. `/readyz` fails while draining; shutdown closes the server, then the pool.                              |
| Least privilege            | A migrator role owns the schema; the API connects as an app role with `SELECT` and `INSERT` only.                                                                                                         |
| Redundancy                 | A managed PostgreSQL primary with a standby and automatic failover. The repository layer is the seam for a read replica, deliberately not wired: a list read right after a create could miss the new row. |
| Vertical scaling           | Container CPU and memory, pool size per process, PostgreSQL instance size.                                                                                                                                |
| Containers                 | Multi-stage images running as non-root users.                                                                                                                                                             |

## 9. Left out on purpose

Turborepo or Nx, NestJS, Prisma, TypeORM, GraphQL or tRPC (the specification fixes REST shapes), Redis, Kubernetes, OpenTelemetry, Swagger UI in production, pagination, authentication and editing. Each adds weight that four endpoints do not need. Ideas for the API itself are in the README's "API design suggestions".

## 10. Library behaviour checked at the source

Each of these would have compiled and then silently done the wrong thing:

| Finding                                                                                                        | Change                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`; the old key is ignored and the default only warns    | `onUnhandledFrame: "error"`, so an unmocked request fails the test                                                                                                |
| Fastify plugins are encapsulated                                                                               | The error handler, JSON-only parser and security plugins are wrapped with `fastify-plugin`, or they never reach the route plugins                                 |
| TypeScript 6 needs explicit `rootDir` and `types`                                                              | Both are set in the build configs; otherwise output lands in `dist/src/` and the container cannot start                                                           |
| PostgreSQL 15+ gives no `CREATE` on schema `public` by default                                                 | The migrator role owns the database and schema; the app role's grants are in migration `0001`, because the tables do not exist when the init script runs          |
| nginx's own error pages are HTML                                                                               | JSON `error_page` locations with an explicit charset                                                                                                              |
| `@fastify/rate-limit` keys on `req.ip`, and `trustProxy` defaults to false                                     | Rate limiting moved to nginx                                                                                                                                      |
| `newman@6.2.3` pins dependencies with high and critical advisories                                             | CI gates on `pnpm audit:prod`; the full audit runs without blocking                                                                                               |
| Zod 4 length checks run on any input with a `length`, even after a type error                                  | One validation message per field (§ 5)                                                                                                                            |
| PostgreSQL reports `23001` (`restrict_violation`), not `23503`, when a delete hits an `ON DELETE RESTRICT` key | The teacher repository checks `23001` on `classes_form_teacher_id_fkey`; an insert-side violation stays `23503`, so the two cannot be confused                    |
| axe measures colour contrast mid-animation, so a fading modal mask produces a false failure                    | The dialog scan waits until no animation is running                                                                                                               |
| CSS Modules scope class names per file                                                                         | Responsive tab padding lives in `NavTab.module.css`, beside the class it styles; in `TopNav.module.css` it matched nothing and the nav overflowed a 320 px screen |

One check was itself wrong and is kept as a lesson: Zod's `target: "draft-7"` looked like a bug from the type definitions, but the runtime aliases it to `"draft-07"`. Reading the typings instead of the code that runs is a wrong-layer check.

## 11. Changes after review

A review of the built app against the specification, the designs and these decisions led to these changes, each test first:

| Change                                                                                                                                          | Reason                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1 restored: subject and level lists enforced at the API; contact numbers trimmed, not stripped, at the API; the form requires a leading 6      | § 5 — the looser rules accepted the designs' own error example and had no new evidence behind them         |
| `openapi.json` lists the allowed subject and level values                                                                                       | Before, it showed only "a non-empty string", because the generator sees the trimming step and not the list |
| One validation message per field                                                                                                                | § 5 — an array value reported a contradictory "is required"                                                |
| The empty-state Add button sits in the card, under the message; the header button shows while loading, on a load error and when there are items | The empty-state designs show the button in the card and none in the header                                 |
| The no-teachers panel renders through `popupRender`, and the inline note uses the body text colour                                              | Both failed WCAG AA contrast, and the link sat inside a `listbox`                                          |

Kept as they were: the response shapes, D2, D3, D4 and the status codes.

Known limits, not fixed: antd's empty `Select` still points `aria-activedescendant` at an option that does not exist, and its scrolling option list is not tab-focusable (keyboard users move through it with the arrow keys). Both come from the library and need an upstream fix or a custom combobox.

## 12. Later changes: deleting, contact prefixes, the form teacher's email

These were asked for after the review above. Each was built test first.

### Contact numbers start with 6, 8 or 9, in the form and the API

| Chosen                                                   | Considered                                                                      | Why                                                                                                                                                                    |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `^[689]\d{7}$` in both, sharing `CONTACT_NUMBER_PATTERN` | Leading 6 in the form only (the previous rule); also accepting 3 (VoIP numbers) | Singapore's 8-digit numbers start with 6 (fixed line) or 8 and 9 (mobile); work contacts can be mobiles. One shared pattern means the form and the API cannot disagree |

Trade-off: the designs' error example `9283 9999` is now valid, so that frame no longer reproduces, and an API client sending a 3-prefixed number gets 400.

### Deleting teachers and classes

| Decision                                                                                                      | Considered                                                    | Why                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DELETE /api/teachers/{email}` and `DELETE /api/classes/{teacherEmail}`                                       | An `id` in every response; deleting a class by level and name | Email is the only public unique key for a teacher, and each teacher has at most one class, so the form teacher's email identifies a class. An `id` would change every response; (level, name) is not unique (D3) |
| `204 No Content`, no body; a JSON `404` when nothing matches                                                  | `200` with the deleted item                                   | Nothing useful to return; the error format stays `{ "error": … }`                                                                                                                                                |
| A teacher who is still a form teacher gets `409 Teacher is the form teacher of a class and cannot be deleted` | Delete the class too (cascade)                                | Nothing is lost by accident. The existing `ON DELETE RESTRICT` key decides, so a class added at the same moment cannot slip through                                                                              |
| The teacher repository turns PostgreSQL's `23001` into `TeacherIsFormTeacherError`                            | Map it centrally, like `23505`                                | The meaning belongs to the delete operation; the repository knows which operation ran                                                                                                                            |
| Migration `0002` grants the app role `DELETE`; `UPDATE` and `TRUNCATE` stay withheld                          | Widen migration `0001`                                        | A new migration reaches databases that already ran `0001`                                                                                                                                                        |
| `405` on each path lists what it allows: `GET, HEAD, POST` on the collections, `DELETE` on one item           | Keep the fixed `PUT, PATCH, DELETE` list                      | `registerMethodNotAllowed` now derives the unsupported methods from the allowed ones                                                                                                                             |

### The form teacher's email in class responses

The Classes page needs the form teacher's email to delete a class, but the specification's class shape gives only the name, and names are not unique.

| Chosen                                                                       | Considered                                                                                                                | Why                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `formTeacher: { name, email }` in `POST /api/classes` and `GET /api/classes` | Match the name against the teacher list, asking which teacher when the name is shared; or disable Delete for shared names | The simplest correct client, at the cost of one field beyond the specification's example. The README says so |

### Delete in the web app

Each row ends with a delete icon (antd's `DeleteOutlined`, in a text-type `IconButton` with a "Delete" tooltip). The button's accessible name is "Delete <teacher or class name>", and the column header shows no text but is named "Actions" for screen readers. A `ConfirmDialog` (antd `Modal`, in `components/ui/`) asks first. A refusal is explained in the dialog in the designs' voice ("This teacher is the form teacher of a class. Delete the class first."), and the list refetches afterwards. There is no design for this; it follows antd's defaults and the existing error patterns.
