# School Portal

An admin web app and REST API for registering teachers and adding classes, each with exactly one form teacher. It is one TypeScript repository: a Fastify API on PostgreSQL, a React and Ant Design web app, and a shared Zod contract that both sides validate against. The full stack runs in Docker, behind nginx.

The reasoning, the code walk-through and a requirement-by-requirement map are under [Further reading](#further-reading).

**Quick start.** With Node.js 24 or newer, pnpm 12.21.0 and Docker running, from the repository root:

```sh
pnpm install
pnpm env:init
pnpm stack:up
```

Then open http://localhost:8080. The steps below explain each command, how to check and stop the stack, how to develop with live reload, and how to run the tests.

**Contents:** [Run it locally](#run-it-locally) · [Local development](#local-development) · [Testing](#testing) · [Troubleshooting](#troubleshooting) · [Hosted links](#hosted-links) · [API](#api) · [Assumptions](#assumptions) · [Rules added from the design](#rules-added-from-the-design-enforced) · [API design suggestions](#api-design-suggestions) · [Architecture and security](#architecture-and-security) · [Project structure](#project-structure) · [Further reading](#further-reading)

## Run it locally

Four steps: install the tools, start the stack, check it works, stop it. A first run takes a few minutes, mostly Docker building the images.

### 1. Install the prerequisites

| Tool                   | Version                                | Check with               | Install                                                       |
| ---------------------- | -------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| Node.js                | 24 or 26 (the repository pins 26.13.1) | `node --version`         | `mise install` reads `mise.toml`; or download from nodejs.org |
| pnpm                   | 12.21.0                                | `pnpm --version`         | `npm install --global pnpm@12.21.0` (or `mise install`)       |
| Docker with Compose v2 | Docker Desktop, or Colima on macOS     | `docker compose version` | docker.com, or `brew install colima docker docker-compose`    |

Docker must be running before step 2 (open Docker Desktop, or run `colima start`). With Colima, keep the repository under your home directory: Colima shares only `~` with its virtual machine by default, and the stack mounts the database roles script from the repository.

### 2. Start the stack

From the repository root:

```sh
pnpm install
pnpm env:init
pnpm stack:up
```

| Command         | What it does                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm install`  | Installs every package's dependencies from the lockfile                                                                                          |
| `pnpm env:init` | Writes `.env` with random database passwords. It refuses to overwrite an existing `.env`                                                         |
| `pnpm stack:up` | Builds the API and web images, starts PostgreSQL, runs the database migrations once, starts the API and nginx, and returns when they are healthy |

### 3. Check it works

- Web app: http://localhost:8080
- API: http://localhost:8080/api

```sh
curl http://localhost:8080/api/teachers
```

returns `{"data":[]}` on a fresh database. To add a teacher from the command line:

```sh
curl -X POST http://localhost:8080/api/teachers \
  -H 'Content-Type: application/json' \
  -d '{"name":"Mary","subject":"Mathematics","email":"teachermary@gmail.com","contactNumber":"68129414"}'
```

### 4. Stop or reset

| To                         | Run                                                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stop and delete all data   | `pnpm stack:down`                                                                                                                                      |
| Stop but keep the data     | `docker compose stop`, then `pnpm stack:up` to start again                                                                                             |
| Use another port than 8080 | set `WEB_PORT` in `.env`, then `pnpm stack:up`                                                                                                         |
| Generate new passwords     | `pnpm stack:down`, delete `.env`, `pnpm env:init`, `pnpm stack:up` (the database keeps the passwords it was created with, so it must be deleted first) |

### Without pnpm

If Node.js 24 or newer is installed but pnpm is not, the stack needs only the environment file:

```sh
node scripts/initEnv.ts
docker compose up --build --wait
```

## Local development

Live reload for the API and the web app, with only PostgreSQL in Docker.

1. Run `pnpm install` and `pnpm env:init` once, as in step 2.
2. Start only PostgreSQL and the migrations. This also publishes PostgreSQL on `127.0.0.1:5432`:

   ```sh
   docker compose -f compose.yaml -f compose.dev.yaml up -d postgres migrate
   ```

3. Start the API and the web app with live reload:

   ```sh
   pnpm dev
   ```

- Web app: http://localhost:5173 (Vite forwards `/api` to the API)
- API: http://localhost:3000

The API reads `.env` from the repository root. Stop `pnpm dev` with Ctrl+C, and the database with `docker compose stop postgres`. The full stack and this setup share one Compose project, so `pnpm stack:down` deletes the development database and its data too.

## Testing

### Before the first run

1. Install the dependencies (`pnpm install`, as in step 2).
2. The integration tests start their own PostgreSQL in Docker, so Docker must be running. On macOS with Colima, also set:

   ```sh
   export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"
   export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
   export NODE_OPTIONS=--dns-result-order=ipv4first
   ```

3. The contract and end-to-end tests run against the stack, so start it (`pnpm stack:up`) and install the test browser once:

   ```sh
   pnpm -F @school-portal/e2e exec playwright install chromium
   ```

   These tests add teachers and classes to the running stack's database.

### Commands

| Layer                                       | Command                 | Needs             | Proves                                                                                                                                                    |
| ------------------------------------------- | ----------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                                        | `pnpm test:unit`        | nothing           | Field rules at every boundary, services with in-memory fakes, error mapping, env config, HTTP plumbing through Fastify `inject()`                         |
| Component                                   | `pnpm test:component`   | nothing           | Every screen state and design message, with the API faked by MSW                                                                                          |
| Unit and component with coverage thresholds | `pnpm test:coverage`    | nothing           | The same tests, failing below the coverage targets                                                                                                        |
| API integration                             | `pnpm test:integration` | Docker            | Real PostgreSQL 18 (Testcontainers) as the restricted app role: exact bodies, case-insensitive uniqueness, constraint mapping, ten-way races, role grants |
| Contract                                    | `pnpm test:contract`    | the running stack | The deployed stack through nginx with Newman: statuses, content type, JSON Schemas generated from the contract, error shape, nginx's JSON error pages     |
| End to end                                  | `pnpm test:e2e`         | the running stack | Both user flows, deleting a class and a teacher, the form-teacher conflict, responsive widths and WCAG A/AA axe scans in Chromium (Playwright)            |

`pnpm test` runs the unit and component layers. Static checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm audit:prod`. Drift checks: `pnpm openapi:write --check` and `pnpm postman:sync --check`.

### Postman

Import `postman/school-portal.postman_collection.json` and `postman/local.postman_environment.json`, then run the collection in order; the requests build on each other. Each run generates fresh emails and class names, so it can be repeated against the same database; its last folder deletes the class and teacher it created. The JSON Schemas and exact messages in the collection variables are generated from the contract by `pnpm postman:sync`. The environment's `baseUrl` is fixed at `http://localhost:8080`; change it there if you change `WEB_PORT`.

## Troubleshooting

| Symptom                                                                         | Cause                                                                           | Fix                                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `pnpm stack:up` stops with `run pnpm env:init first`                            | There is no `.env`                                                              | `pnpm env:init`                                                                                                              |
| `pnpm env:init` says `.env already exists`                                      | It never overwrites passwords                                                   | Keep it, or follow "Generate new passwords" above                                                                            |
| Docker cannot connect to its daemon                                             | Docker is not running                                                           | Start Docker Desktop, or `colima start`                                                                                      |
| Docker reports that port 8080 is already allocated                              | Another program uses the port                                                   | Set `WEB_PORT=8081` in `.env` and run `pnpm stack:up`; change `baseUrl` in `postman/local.postman_environment.json` to match |
| The `migrate` service fails with `password authentication failed`               | `.env` was regenerated after the database was created                           | `pnpm stack:down`, then `pnpm stack:up`                                                                                      |
| The `migrate` service fails with `role "school_portal_migrator" does not exist` | With Colima, the repository is outside `~`, so the roles script was not mounted | Move the repository under your home directory, then `pnpm stack:down` and `pnpm stack:up`                                    |
| `pnpm install` refuses to run                                                   | The Node.js or pnpm version is outside the supported range                      | Install the versions in step 1                                                                                               |

For service logs, run `docker compose logs api` (or `postgres`, `migrate`, `web`).

## Hosted links

- Web app: https://136-69-196-36.sslip.io
- API: https://136-69-196-36.sslip.io/api, for example `GET https://136-69-196-36.sslip.io/api/teachers`

The hosted app is the same Docker Compose stack as the local one, on a single Google Compute Engine `e2-micro` VM. [compose.prod.yaml](compose.prod.yaml) adds Caddy in front of nginx to serve HTTPS with a Let's Encrypt certificate, and stops nginx publishing port 8080. `sslip.io` is a free DNS service that resolves the hostname to the VM's IP address.

There is no login, as the brief allows, so everyone using the link shares one database.

To host it the same way, add `PUBLIC_HOSTNAME=<your hostname>` and `COMPOSE_FILE=compose.yaml:compose.prod.yaml` to `.env`, open ports 80 and 443, then run `docker compose up --build --wait`.

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
{
  "level": "Primary 1",
  "name": "Class 1A",
  "formTeacher": { "name": "Mary", "email": "teachermary@gmail.com" }
}
```

`formTeacher.email` is not in the specification's example. It is added so that a client can address the class for deletion (see below); it is the teacher's email as stored.

### List classes

`GET /api/classes` returns `200 OK`, in the order the classes were added:

```json
{
  "data": [
    {
      "level": "Primary 1",
      "name": "Class 1A",
      "formTeacher": { "name": "Mary", "email": "teachermary@gmail.com" }
    },
    {
      "level": "Primary 2",
      "name": "Class 2B",
      "formTeacher": { "name": "Ken", "email": "teacherken@gmail.com" }
    }
  ]
}
```

An empty list is `{ "data": [] }`.

### Delete a teacher

`DELETE /api/teachers/{email}` deletes the teacher with that email (case-insensitive) and returns `204 No Content` with no body. A teacher who is still a form teacher cannot be deleted: delete the class first.

```sh
curl -X DELETE http://localhost:8080/api/teachers/teacherken@gmail.com
```

### Delete a class

`DELETE /api/classes/{teacherEmail}` deletes the class whose form teacher has that email and returns `204 No Content`. A class is addressed by its form teacher because each teacher has at most one class, while a class's level and name are not unique. The teacher can then take another class or be deleted.

```sh
curl -X DELETE http://localhost:8080/api/classes/teachermary@gmail.com
```

### Errors

Every error body is `{ "error": "<message>" }`. Each invalid field reports its first problem; problems in several fields are joined into one string with `"; "`.

| Case                                                                   | Status | `error`                                                             |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| Malformed JSON                                                         | 400    | Request body must be valid JSON                                     |
| Body is not a JSON object, is empty, or is missing                     | 400    | Request body must be a JSON object                                  |
| A field is missing, empty, the wrong type, too long or badly formatted | 400    | for example `name is required; email must be a valid email address` |
| Subject not in the list                                                | 400    | `subject must be one of: English Language, …`                       |
| Level not in the list                                                  | 400    | `level must be one of: Primary 1, …`                                |
| Unknown `teacherEmail`                                                 | 400    | No teacher found with email `<email>`                               |
| Malformed email in a delete path                                       | 400    | `email must be a valid email address` (or `teacherEmail …`)         |
| Delete: no teacher has the email                                       | 404    | No teacher found with email `<email>`                               |
| Delete: no class has a form teacher with the email                     | 404    | No class found with form teacher email `<email>`                    |
| Body length does not match `Content-Length`                            | 400    | Request body size did not match Content-Length                      |
| Teacher email already registered (case-insensitive)                    | 409    | A teacher with this email already exists                            |
| Teacher is already a form teacher                                      | 409    | Teacher is already the form teacher of another class                |
| Delete a teacher who is still a form teacher                           | 409    | Teacher is the form teacher of a class and cannot be deleted        |
| Body over 16 KiB                                                       | 413    | Request body too large                                              |
| Body sent with a non-JSON `Content-Type`                               | 415    | Content-Type must be application/json                               |
| Unknown route                                                          | 404    | Not found                                                           |
| `PUT`, `PATCH` or `DELETE` on `/api/teachers` or `/api/classes`        | 405    | Method not allowed (with `Allow: GET, HEAD, POST`)                  |
| `GET`, `POST`, `PUT` or `PATCH` on one teacher or class                | 405    | Method not allowed (with `Allow: DELETE`)                           |
| Any other server failure                                               | 500    | Internal server error (details are logged, never returned)          |

The API does not define `OPTIONS`; with CORS off it returns the JSON `404`. `GET /api` without a trailing slash is served by nginx as a JSON `404` too.

nginx adds its own, in the same shape:

| Case                                                  | Status        | `error`                |
| ----------------------------------------------------- | ------------- | ---------------------- |
| Body over 1 MiB                                       | 413           | Request body too large |
| More than about 50 requests a second from one address | 429           | Too many requests      |
| API unreachable, unavailable or too slow              | 502, 503, 504 | Service unavailable    |

### OpenAPI

`apps/api/openapi.json` is generated from the route schemas (`pnpm openapi:write`); CI fails if it is out of date. It lists the allowed subject and level values (the API trims a value before matching it against the list), the contact-number pattern, and both delete operations with their `204` and error replies. Router-level `404`/`405` responses are documented in the error table rather than on each operation, because they are not operation-level outcomes.

### Health

The API serves `GET /healthz` (the process is up) and `GET /readyz` (the database answers and the server is not shutting down) on its own port. nginx does not expose them.

## Assumptions

Where the brief is silent, these are the choices made. They are grouped by topic; the numbers run on so that each can be referred to.

### Scope

1. There is no login or access control, as the brief allows. Anyone who can reach the API can create and delete teachers and classes.
2. Teachers and classes can be deleted; update and reassignment are not supported. To move a class to another teacher, delete it and add it again.
3. Migrations run as a separate step before the API starts. No seed data is provided.

### Identity and uniqueness

4. Teacher email is unique and case-insensitive, and is stored as sent. A duplicate returns 409, so re-running a test that registers the same email gets 409.
5. A teacher who is already a form teacher cannot be given another class (409).
6. A class's level and name together are not unique; only the form-teacher rule applies. See the suggestions below.
7. A class is addressed by its form teacher's email, which is unique per class: `DELETE /api/classes/{teacherEmail}`. Class responses therefore include `formTeacher.email`, which the specification's example omits.
8. A teacher who is still a form teacher cannot be deleted (409); deleting a teacher never deletes a class.

### Validation

9. Subject and level must come from the design's fixed lists; see [Rules added from the design](#rules-added-from-the-design-enforced).
10. Contact number: 8 digits starting with 6, 8 or 9 (Singapore fixed-line and mobile numbers), in both the web form and the API. The form strips spaces first; the API trims surrounding spaces and rejects inner ones. The design's error example `9283 9999` is therefore accepted.
11. Email uses a simple `local@domain.tld` check in both the form and the API. `teacher@gov.sg` is accepted, although the design's error example shows it as invalid.
12. Length limits: 100 characters for a teacher name, 50 for a class name, 254 for an email.
13. Names may contain any Unicode except control characters.
14. Unknown request fields are ignored.

### Responses and errors

15. A successful POST returns the created resource, in the same shape as a list item.
16. Lists are returned in insertion order, without pagination. An empty list is `{ "data": [] }`.
17. An unknown `teacherEmail` in `POST /api/classes` returns 400 and names the email.
18. A body with a non-JSON `Content-Type` returns 415; a POST with no body returns 400.
19. `error` is always one string; each invalid field reports its first problem.
20. Deleting returns `204` with no body; deleting something that does not exist returns a JSON `404`.
21. The API stores and returns contact numbers as eight digits; the web app shows them as `6736 3939`.
22. Rate limiting is done by nginx: 50 requests a second per address, with a burst of 200.

### Web app and designs

23. Where the designs disagree with each other: the tab is "Teachers" (one frame says "Manage Teachers"), and the subject field is "Subject" with "Select a subject" (the component sheet says "Main Subject" with "Select a level").
24. The Form Teacher options show names only, adding the email only when two teachers share a name. With no teachers, the dropdown shows "No existing teachers." and an "Add a teacher" link.
25. The Form Teacher dropdown lists every teacher, including those already assigned, because the API does not say who is assigned; the conflict appears on submit.
26. There is no designed error state for Add Class; it follows the Add Teacher pattern.
27. Add Class keeps a one-hour session draft. It survives the "Add a teacher" round trip and is cleared after a successful save or an explicit Back.
28. There is no design for deleting. Each table row ends with a delete icon; the web app asks for confirmation and shows the reason if the API refuses.

## Rules added from the design (enforced)

The specification lists no field rules. The linked Figma's documentation card does, and this submission enforces them in both the web form and the API:

- **Subject** must be one of: English Language, Mother Tongue Language, Mathematics, Science, Art, Music, Physical Education, Social Studies, Character and Citizenship Education.
- **Class level** must be one of: Primary 1 to Primary 6.
- Both are trimmed and then matched exactly, so `mathematics` is rejected. The 400 message lists the allowed values.
- **Contact number** must be 8 digits starting with 6, 8 or 9, in the form and the API. This is the Singapore numbering rule for fixed-line (6) and mobile (8, 9) numbers, rather than the design's error example, which implies a leading 6 only.

| For enforcing the lists in the API                                | Against                                                                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| The web app and the API accept and reject exactly the same values | The specification's text states none of these rules                                                              |
| A direct API call cannot store a value the form would refuse      | An automated tester sending an unlisted subject or level gets 400, and its class tests for that teacher fail too |
| Allow-list validation is the safer kind of input validation       | Adding a subject or level needs a code change and a deploy                                                       |
| Reports by subject or level never meet typos                      | Exact matching is strict for API clients                                                                         |

Every value in the specification's examples passes. Loosening the rules is a change to `packages/contract/src/fieldRules.ts` and `optionLists.ts`.

## API design suggestions

| Suggestion                                                                                   | Why                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Give every teacher and class a stable public `id`, and address them by it                    | Emails can change, and today a delete puts the email in the URL, so it lands in access logs                                         |
| Identify the form teacher in the specification's class shape                                 | `formTeacher.name` alone is ambiguous, since names are not unique; this API adds `formTeacher.email` so a client can delete a class |
| Require authentication and an admin role before real use                                     | Creating and deleting are open to anyone who can reach the API, as the brief's scope allows                                         |
| Move the subject and level lists into lookup tables, with `GET` endpoints                    | They could change without a deploy, and the web app could load them instead of shipping a copy                                      |
| Decide whether a class's level and name should be unique                                     | Two "Primary 1, Class 1A" are allowed today (assumption 6)                                                                          |
| Say whether a teacher is already a form teacher, or offer `GET /api/teachers?available=true` | The Add Class form could hide teachers the API would refuse                                                                         |
| Add `PATCH /api/classes/{teacherEmail}` to move a class to another form teacher              | One request instead of delete-and-add                                                                                               |
| Return a `Location` header with each 201                                                     | The standard way to tell a client where the new resource lives                                                                      |
| Add a stable machine-readable `code` next to `error`                                         | Clients could branch on codes instead of English messages; the web app matches messages today                                       |
| Use 422 for well-formed requests that break a business rule                                  | Separates "malformed" (400) from "understood but refused"                                                                           |
| Add pagination with a `meta` object                                                          | Lists are unbounded today                                                                                                           |
| Accept an `Idempotency-Key` header on POST                                                   | A retried request after a timeout could not create a duplicate                                                                      |

## Architecture and security

```
Browser ──► nginx :8080 ─┬─ /      static web app (React, Ant Design)
                         └─ /api/  ──► API :3000 (Fastify) ──► PostgreSQL 18
                                       routes → handlers → services → repositories
```

- **Rules that must survive concurrency live in the database.** A unique index on `lower(email)` and a unique `form_teacher_id` decide races, not check-then-insert. Class creation still looks up the teacher before inserting; the unique `form_teacher_id` index closes the race. A test fires ten requests at once and gets exactly one 201.
- **Two database roles.** A migrator role owns the schema; the API connects as an app role that can only `SELECT`, `INSERT` and `DELETE`.
- **Migrations run as their own step**, never on API start-up.
- **Input is validated at the edge** by the shared Zod contract. Queries are always parameterised (Kysely).
- **Body limits**: 16 KiB in the API, 1 MiB in nginx. The API accepts JSON only.
- **Errors never leak internals.** Stack traces and SQL go to the logs, with a request id, never to the client.
- **Headers**: Helmet on the API, with a CSP of `default-src 'none'`; a strict CSP and other security headers on the web app. API responses also send `Cache-Control: no-store` because they contain teacher contact details. Zod runs without `new Function`, so the CSP needs no `unsafe-eval`.
- **CORS is off** unless `CORS_ALLOWED_ORIGINS` is set; the web app and API share an origin through nginx.
- **Rate limiting** is in nginx, so the API holds no per-process state.
- **Configuration** comes from the environment and is validated at start-up. Secrets are generated by `pnpm env:init` and never committed.
- **Containers** are multi-stage and run as non-root users.
- **Supply chain**: new package releases wait a day, dependency install scripts are blocked unless allow-listed, and CI fails on high-severity advisories in production dependencies (`pnpm audit:prod`). The full `pnpm audit` also lists advisories in two dev-only test tools, `newman` (the Postman runner) and `@testcontainers/postgresql`; neither is installed in the images. Dependabot proposes updates weekly.
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

## Further reading

- [docs/DECISIONS.md](docs/DECISIONS.md): why the stack, the repository layout and the validation rules are what they are, with the alternatives weighed.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): what each package and key file does, one request end to end, how the web app loads data and shows errors, the schema and roles, and where the tests live.
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md): each requirement in the brief, how it is met, the files and tests that prove it, and its status.
