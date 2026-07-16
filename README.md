# BugTracker API

A multi-user issue-tracking REST API — a stripped-down Jira/Linear backend — built with **Nest.js**, **TypeScript**, and **PostgreSQL**.

`Nest.js` · `TypeScript` · `PostgreSQL` · `Prisma` · `JWT` · `Docker` · `Jest`

## Why this project

This project demonstrates a complete backend lifecycle: JWT authentication with bcrypt-hashed passwords, role-based and ownership-based access control, a relational schema (users → projects → issues) managed through Prisma migrations, request validation with DTOs, auto-generated OpenAPI docs, and a Jest unit + e2e test suite — all containerised with Docker Compose for one-command setup.

## Screenshot

_Swagger UI at `/api`, listing all endpoints grouped by `auth`, `projects`, and `issues`:_

![Swagger UI](docs/swagger-screenshot.png)

> Run the app and open `http://localhost:3000/api` to see it live; drop a screenshot at `docs/swagger-screenshot.png` to render it here.

## Architecture

The code is organised the way Nest expects: one module per domain concern, each with its own controller, service, and DTOs.

```
src/
  auth/       # register, login, JWT strategy, guards, roles decorator
  users/      # user lookups used by auth
  projects/   # project CRUD, ownership checks
  issues/     # issue CRUD, filtering, pagination
  prisma/     # PrismaService — a single injectable DB client
```

Nest's module + provider (dependency injection) system plays the same role a hand-rolled service layer would in a simpler framework — it just makes the separation of concerns and testability structural rather than a convention you have to enforce yourself.

**Access control** has two layers:
- `JwtAuthGuard` on every `projects`/`issues` route — you must be authenticated.
- Ownership checks inside `ProjectsService` — only a project's owner or a user with the `ADMIN` role can update or delete it. Issue creation/updates are open to any authenticated user, matching the brief's "members can create/update issues."

## Running it

**With Docker (one command):**

```bash
docker compose up --build
```

This builds the API image, starts Postgres, runs `prisma migrate deploy`, and boots the API on `http://localhost:3000`. Swagger docs live at `http://localhost:3000/api`.

**Locally, without Docker:**

```bash
cp .env.example .env         # adjust DATABASE_URL if needed
docker compose up -d postgres # or point DATABASE_URL at your own Postgres
npm install
npm run prisma:migrate
npm run start:dev
```

## Running the tests

```bash
npm test          # unit tests (issues service)
npm run test:e2e  # e2e tests (auth flow, projects + issues flow) — needs Postgres running
```

## API overview

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in, receive a JWT |
| POST | `/projects` | Create a project |
| GET | `/projects` | List your projects |
| GET | `/projects/:id` | Get a project |
| PATCH | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project (owner or admin only) |
| POST | `/projects/:projectId/issues` | Create an issue |
| GET | `/projects/:projectId/issues` | List issues (filter by `status`/`priority`, paginate with `page`/`limit`) |
| GET | `/projects/:projectId/issues/:id` | Get an issue |
| PATCH | `/projects/:projectId/issues/:id` | Update an issue (status, priority, assignee, ...) |
| DELETE | `/projects/:projectId/issues/:id` | Delete an issue |

All routes except `/auth/*` require `Authorization: Bearer <token>`.

## What's next

- Comments on issues
- Rate limiting (`@nestjs/throttler`)
- A `GET /projects/:id/stats` endpoint (issue counts by status)
- A project-membership model, so issues can be scoped to more than just the owner
