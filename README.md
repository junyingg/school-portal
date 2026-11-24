# School Portal

An admin web app and REST API for registering teachers and adding classes, each with exactly one form teacher. It is one TypeScript repository: a Fastify API on PostgreSQL, a React and Ant Design web app, and a shared Zod contract that both sides validate against. The full stack runs in Docker, behind nginx.

## Hosted links

Not deployed. The app runs locally with Docker; see [Quick start](#quick-start).

## Prerequisites

- **Node.js 24.0 or newer, below 27**, and **pnpm 12.21.0**. The repository pins 26.13.1 in `.node-version` and `mise.toml`; CI runs both 24.21.0 and 26.13.1. The Docker images use Node 26.
  - With [mise](https://mise.jdx.dev): `mise install`.
  - Without mise: install Node.js 24 or newer, then `npm install --global pnpm@12.21.0`.
- **Docker** with Compose v2. On macOS, Colima or Docker Desktop both work.

## Quick start

```sh
pnpm install
pnpm env:init
pnpm stack:up
```

- Web app: http://localhost:8080
- API: http://localhost:8080/api

`pnpm env:init` writes `.env` with random database passwords and refuses to overwrite an existing one. `pnpm stack:up` builds both images, starts PostgreSQL, runs the migration once, then starts the API and the web server and waits until PostgreSQL and the API are healthy and the web server is running. `pnpm stack:down` stops the stack and deletes its data volume.

If Node.js 24+ is available but pnpm is not, the built stack needs only the host-side environment file:

```sh
node scripts/initEnv.ts
docker compose up --build --wait
```

Set `WEB_PORT` in `.env` if port 8080 is taken.

## Local development

```sh
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres migrate
pnpm dev
```

- Web app: http://localhost:5173 (Vite; it proxies `/api` to the API)
- API: http://localhost:3000

The dev override publishes PostgreSQL on `127.0.0.1:5432` only. The API reads `.env` from the repository root.

## API

Every API request and response body is JSON. Every API response, including errors from nginx, has `Content-Type: application/json; charset=utf-8`.

### Register a teacher

`POST /api/teachers`

```json
{
  "name": "Mary",
  "subject": "Mathematics",
  "email": "teachermary@gmail.com",
  "contactNumber": "68129414"
}
```

`201 Created` with the teacher as stored:

```json
{
  "name": "Mary",
  "subject": "Mathematics",
  "email": "teachermary@gmail.com",
  "contactNumber": "68129414"
}
```

### List teachers

`GET /api/teachers` returns `200 OK`, in the order the teachers were registered:

```json
{
  "data": [
    {
      "name": "Mary",
      "subject": "Mathematics",
      "email": "teachermary@gmail.com",
      "contactNumber": "68129414"
    },
    {
      "name": "Ken",
      "subject": "Mother Tongue Language",
      "email": "teacherken@gmail.com",
      "contactNumber": "61824191"
    }
  ]
}
```

### Add a class

`POST /api/classes`

```json
{ "level": "Primary 1", "name": "Class 1A", "teacherEmail": "teachermary@gmail.com" }
```

`201 Created`:

```json
{ "level": "Primary 1", "name": "Class 1A", "formTeacher": { "name": "Mary" } }
```

### List classes

`GET /api/classes` returns `200 OK`, in the order the classes were added:

```json
{
  "data": [
    { "level": "Primary 1", "name": "Class 1A", "formTeacher": { "name": "Mary" } },
    { "level": "Primary 2", "name": "Class 2B", "formTeacher": { "name": "Ken" } }
  ]
}
```

An empty list is `{ "data": [] }`.

### Errors

Every error body is `{ "error": "<message>" }`. Several validation problems are joined into one string with `"; "`.

| Case                                                                   | Status | `error`                                                             |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| Malformed JSON                                                         | 400    | Request body must be valid JSON                                     |
| Body is not a JSON object, is empty, or is missing                     | 400    | Request body must be a JSON object                                  |
| A field is missing, empty, the wrong type, too long or badly formatted | 400    | for example `name is required; email must be a valid email address` |
| Subject not in the list                                                | 400    | `subject must be one of: English Language, …`                       |
| Level not in the list                                                  | 400    | `level must be one of: Primary 1, …`                                |
| Unknown `teacherEmail`                                                 | 400    | No teacher found with email `<email>`                               |
| Body length does not match `Content-Length`                            | 400    | Request body size did not match Content-Length                      |
| Teacher email already registered (case-insensitive)                    | 409    | A teacher with this email already exists                            |
| Teacher is already a form teacher                                      | 409    | Teacher is already the form teacher of another class                |
| Body over 16 KiB                                                       | 413    | Request body too large                                              |
| Body sent with a non-JSON `Content-Type`                               | 415    | Content-Type must be application/json                               |
| Unknown route                                                          | 404    | Not found                                                           |
| `PUT`, `PATCH` or `DELETE` on either path                              | 405    | Method not allowed (with `Allow: GET, HEAD, POST`)                  |
| Any other server failure                                               | 500    | Internal server error (details are logged, never returned)          |

The API does not define `OPTIONS`; with CORS off it returns the JSON `404`. `GET /api` without a trailing slash is served by nginx as a JSON `404` too.

nginx adds its own, in the same shape:

| Case                                                  | Status        | `error`                |
| ----------------------------------------------------- | ------------- | ---------------------- |
| Body over 1 MiB                                       | 413           | Request body too large |
| More than about 50 requests a second from one address | 429           | Too many requests      |
| API unreachable, unavailable or too slow              | 502, 503, 504 | Service unavailable    |

### OpenAPI

`apps/api/openapi.json` is generated from the route schemas (`pnpm openapi:write`); CI fails if it is out of date. It lists the allowed subject and level values; the API trims a value before matching it against the list. Router-level `404`/`405` responses are documented in the error table rather than on each operation, because they are not operation-level outcomes.

### Health

The API serves `GET /healthz` (the process is up) and `GET /readyz` (the database answers and the server is not shutting down) on its own port. nginx does not expose them.

## Testing

| Layer                                       | Command                 | Needs             | Proves                                                                                                                                                    |
| ------------------------------------------- | ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                                        | `pnpm test:unit`        | nothing           | Field rules at every boundary, services with in-memory fakes, error mapping, env config, HTTP plumbing through Fastify `inject()`                         |
| Component                                   | `pnpm test:component`   | nothing           | Every screen state and design message, with the API faked by MSW                                                                                          |
| Unit and component with coverage thresholds | `pnpm test:coverage`    | nothing           | The same tests, failing below the coverage targets                                                                                                        |
| API integration                             | `pnpm test:integration` | Docker            | Real PostgreSQL 18 (Testcontainers) as the restricted app role: exact bodies, case-insensitive uniqueness, constraint mapping, ten-way races, role grants |
| Contract                                    | `pnpm test:contract`    | the running stack | The deployed stack through nginx with Newman: statuses, content type, JSON Schemas generated from the contract, error shape, nginx's JSON error pages     |
| End to end                                  | `pnpm test:e2e`         | the running stack | Both user flows, the form-teacher conflict, responsive widths and a WCAG A/AA axe scan in Chromium (Playwright)                                           |

`pnpm test` runs the unit and component layers. Before the first end-to-end run, install the browser with `pnpm -F @school-portal/e2e exec playwright install chromium`.

On macOS with Colima, Testcontainers needs:

```sh
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
export NODE_OPTIONS=--dns-result-order=ipv4first
```

Static checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm audit:prod`. Drift checks: `pnpm openapi:write --check` and `pnpm postman:sync --check`.

### Postman

Import `postman/school-portal.postman_collection.json` and `postman/local.postman_environment.json`, then run the collection in order; the requests build on each other. Each run generates fresh emails and class names, so it can be repeated against the same database. The JSON Schemas and exact messages in the collection variables are generated from the contract by `pnpm postman:sync`. The environment's `baseUrl` is fixed at `http://localhost:8080`; change it there if you change `WEB_PORT`.

## Assumptions

1. Teacher email is unique and case-insensitive, and is stored as sent. A duplicate returns 409. Re-running a test that registers the same email therefore gets 409.
2. A successful POST returns the created resource, in the same shape as a list item.
3. An unknown `teacherEmail` returns 400 and names the email.
4. A teacher who is already a form teacher returns 409.
5. A class's level and name together are not unique; only the form-teacher rule applies. See the suggestions below.
6. Subject and level must come from the design's fixed lists; see [Rules added from the design](#rules-added-from-the-design-enforced).
7. Contact number: the web form strips spaces and requires 8 digits starting with 6, matching the design's error example. The API requires 8 digits (surrounding spaces trimmed, inner spaces rejected) and does not enforce the leading 6, because that rule is inferred rather than documented.
8. Email uses a simple `local@domain.tld` check in both the form and the API. `teacher@gov.sg` is accepted, although the design's error example shows it as invalid.
9. Length limits: 100 characters for a teacher name, 50 for a class name, 254 for an email.
10. Lists are returned in insertion order, without pagination.
11. Unknown request fields are ignored.
12. A body with a non-JSON `Content-Type` returns 415; a POST with no body returns 400.
13. An empty list returns `{ "data": [] }`.
14. `error` is always one string.
15. The Form Teacher options show names only, adding the email only when two teachers share a name. With no teachers, the dropdown shows "No existing teachers." and an "Add a teacher" link.
16. Where the designs disagree with each other: the tab is "Teachers" (one frame says "Manage Teachers"), and the subject field is "Subject" with "Select a subject" (the component sheet says "Main Subject" with "Select a level").
17. The Form Teacher dropdown lists every teacher, including those already assigned, because the API does not say who is assigned; the conflict appears on submit.
18. There is no designed error state for Add Class; it follows the Add Teacher pattern.
19. Migrations run as a separate step before the API starts. No seed data is provided.
20. Update, delete and reassignment are not supported.
21. Names may contain any Unicode except control characters.
22. Rate limiting is done by nginx: 50 requests a second per address, with a burst of 200.
23. The web app shows contact numbers as `6736 3939`; the API stores and returns eight digits.
24. Add Class keeps a one-hour session draft. It survives the "Add a teacher" round trip and is cleared after a successful save or an explicit Back.

## Rules added from the design (enforced)

The specification lists no field rules. The linked Figma's documentation card does, and this submission enforces them in both the web form and the API:

- **Subject** must be one of: English Language, Mother Tongue Language, Mathematics, Science, Art, Music, Physical Education, Social Studies, Character and Citizenship Education.
- **Class level** must be one of: Primary 1 to Primary 6.
- Both are trimmed and then matched exactly, so `mathematics` is rejected. The 400 message lists the allowed values.
- **Contact number**: the web form also requires a leading 6, inferred from one error example in the design. The API does not, because that evidence is weak.

| For enforcing the lists in the API                                | Against                                                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| The web app and the API accept and reject exactly the same values | The specification's text states none of these rules                                                              |
| A direct API call cannot store a value the form would refuse      | An automated tester sending an unlisted subject or level gets 400, and its class tests for that teacher fail too |
| Allow-list validation is the safer kind of input validation       | Adding a subject or level needs a code change and a deploy                                                       |
| Reports by subject or level never meet typos                      | Exact matching is strict for API clients                                                                         |

Every value in the specification's examples passes. Loosening the rules is a change to `packages/contract/src/fieldRules.ts` and `optionLists.ts`.

## API design suggestions

- Move the subject and level lists into lookup tables, so they can change without a deploy.
- Accept mobile numbers if work contacts can be mobile.
- Decide whether a class's level and name should be unique.
- Return a `Location` header with each 201.
- Add a stable machine-readable `code` next to `error`.
- Include an `id` or `email` in `formTeacher`; names are not unique.
- Show whether a teacher is already a form teacher, or offer `GET /api/teachers?available=true`, so the form can hide them.
- Use 422 for requests that are well formed but break a business rule.
- Add pagination with a `meta` object once lists grow.
- Add `PUT` and `DELETE` for reassigning a form teacher.
- Accept an `Idempotency-Key` header, so a retried POST cannot create a duplicate.

## Architecture and security

```
Browser ──► nginx :8080 ─┬─ /      static web app (React, Ant Design)
                         └─ /api/  ──► API :3000 (Fastify) ──► PostgreSQL 18
                                       routes → handlers → services → repositories
```

- **Rules that must survive concurrency live in the database.** A unique index on `lower(email)` and a unique `form_teacher_id` decide races, not check-then-insert. Class creation still looks up the teacher before inserting; the unique `form_teacher_id` index closes the race. A test fires ten requests at once and gets exactly one 201.
- **Two database roles.** A migrator role owns the schema; the API connects as an app role that can only `SELECT` and `INSERT`.
- **Migrations run as their own step**, never on API start-up.
- **Input is validated at the edge** by the shared Zod contract. Queries are always parameterised (Kysely).
- **Body limits**: 16 KiB in the API, 1 MiB in nginx. The API accepts JSON only.
- **Errors never leak internals.** Stack traces and SQL go to the logs, with a request id, never to the client.
- **Headers**: Helmet on the API, with a CSP of `default-src 'none'`; a strict CSP and other security headers on the web app. API responses also send `Cache-Control: no-store` because they contain teacher contact details. Zod runs without `new Function`, so the CSP needs no `unsafe-eval`.
- **CORS is off** unless `CORS_ALLOWED_ORIGINS` is set; the web app and API share an origin through nginx.
- **Rate limiting** is in nginx, so the API holds no per-process state.
- **Configuration** comes from the environment and is validated at start-up. Secrets are generated by `pnpm env:init` and never committed.
- **Containers** are multi-stage and run as non-root users.
- **Supply chain**: new package releases wait a day, dependency install scripts are blocked unless allow-listed, and CI fails on high-severity advisories in production dependencies (`pnpm audit:prod`). Dependabot proposes updates weekly.
- **Scaling**: the API is stateless, its pool size comes from `DB_POOL_MAX`, it exposes a readiness probe, and it drains before shutting down. More copies can run behind a load balancer; a managed PostgreSQL with a standby is the redundancy path.

## Project structure

```
packages/contract/   Zod schemas, field rules, option lists and messages shared by the API and the web app
apps/api/            Fastify API: routes, handlers, services, repositories, error mapping, migrations
apps/web/            React web app: pages, features, shared components, Ant Design wrapper in components/ui
postman/             Postman collection, environment and the schema sync script
e2e/                 Playwright tests against the running stack
docker/              Dockerfiles, nginx config and the PostgreSQL roles script
scripts/initEnv.ts   Generates .env with random passwords
compose.yaml         The full stack; compose.dev.yaml publishes PostgreSQL for local development
```
