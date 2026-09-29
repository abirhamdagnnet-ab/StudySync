# StudySync API Backend

Express 5 API for student learning, quizzes, progress analytics, and AI study conversations with file attachments.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- npm
- A Gemini API key for server-side student AI responses

## Setup

Run these commands from `back_end` in PowerShell:

```powershell
Copy-Item .env.example .env
npm install
```

Edit `.env` and set `DATABASE_URL` to a PostgreSQL database that already exists, plus a private `JWT_SECRET` of at least 32 characters. Set `CORS_ORIGIN` to the exact origin of the frontend, including scheme and port, for example `http://localhost:5173`. Do not use `*`.

For the student assistant, set `GEMINI_API_KEY` in `.env`; `GEMINI_MODEL` defaults to `gemini-2.5-flash`. For the first administrator, set both `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`. Never place provider secrets in frontend code.

Apply schema migrations and seed learning content:

```powershell
npm run migrate
npm run seed
```

`npm run seed` applies SQL seeds and creates the first admin if no admin exists. It does not promote an existing non-admin account. Keep the initial admin password secret and change it through your operational process after setup.

Start the API:

```powershell
npm run dev
```

The default API address is `http://localhost:3000/api`. `GET /api/health` checks both API and database availability.

## Commands

- `npm run dev`: start with Nodemon
- `npm start`: start the server
- `npm test`: run Jest and Supertest suites
- `npm run migrate`: apply sorted SQL migrations and record each applied filename
- `npm run seed`: apply SQL seed files and initialize the first admin
- `npm run simulate`: run the real-service quiz simulation; requires migrated and seeded PostgreSQL data

## Configuration

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `NODE_ENV` | No | `development` | Runtime mode |
| `PORT` | No | `3000` | HTTP port |
| `DATABASE_URL` | Yes | None | PostgreSQL connection URL |
| `JWT_SECRET` | Yes | None | JWT signing and verification secret, minimum 32 characters |
| `JWT_EXPIRES_IN` | No | `1h` | JWT lifetime, in jsonwebtoken duration format |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Exact allowed frontend origin; no wildcard support |
| `GEMINI_API_KEY` | No | Unconfigured | Google Gemini API key used by the server-side student assistant |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name |
| `AI_TIMEOUT_MS` | No | `30000` | AI request timeout; accepted range 1000-120000 ms |
| `INITIAL_ADMIN_EMAIL` | As a pair | None | Initial admin email used by seed command |
| `INITIAL_ADMIN_PASSWORD` | As a pair | None | Initial admin password, minimum 8 characters |
| `SIMULATION_SEED` | No | `20260928` | Deterministic simulation seed |
| `SIMULATION_OUTPUT` | No | `tests/simulation/results.json` | Simulation report output path |
| `SIMULATION_KEEP_USERS` | No | `false` | Keep temporary simulation accounts when set to `true` |

`.env` and uploaded `storage/` files are excluded by `.gitignore`. Never commit credentials or student data.

## Security Notes

- Except health, registration, and login, routes require a Bearer JWT. Role-restricted routes additionally enforce student, teacher, or admin access.
- Student-owned sessions, AI conversations, file attachments, and analytics are queried with the authenticated student ID. Teachers are restricted to their own classes and questions; admins have the documented broader access.
- Student question reads do not select `correct_answer`. Inactive questions are hidden from ordinary question reads.
- JSON request bodies are limited to 32 KiB. Assistant attachments are limited to one 10 MiB PDF, DOCX, or TXT file; stored files are outside public assets and only readable text is sent to the AI provider.
- Password hashes are never returned by API response queries. The Gemini API key remains server-side.
- CORS allows only the exact configured `CORS_ORIGIN`.

### Route Access

| Route group | Access |
|---|---|
| `/health` | Public; database status only |
| `/auth/register`, `/auth/login` | Public; login is rate limited |
| `/auth/me` | Any authenticated user |
| `/admin/*` | Admin only |
| Subject/topic/question reads | Any authenticated user; inactive questions are hidden |
| Subject/topic create | Teacher or admin; edits and deletes are admin only |
| Question create | Teacher or admin; teachers may edit/delete only their own questions; admin may edit all |
| `/teacher/classes/*` | Teacher or admin; teachers are scoped to owned classes, admins can manage all |
| `/quiz/*` | Student only; sessions are scoped to their owner |
| `/students/me/*` | Student only; queries use the authenticated student ID |
| `/ai/*` | Student only; conversations and attached files are owner-scoped; 30 AI answers per student per day |

## API Reference

- [OpenAPI 3.1 specification](openapi.yaml)
- [Database entity relationship diagram](docs/ERD.md)

Protected routes use `Authorization: Bearer <token>`. Register a student through `/auth/register`; an initial administrator is created by `npm run seed` after configuring both initial-admin variables.

## What You Need to Provide

1. A running PostgreSQL server and an empty project database; set its URL in `.env`.
2. A private 32-character-or-longer `JWT_SECRET` and the frontend origin for `CORS_ORIGIN`.
3. For initial admin provisioning, both initial-admin env values. AI features require `GEMINI_API_KEY` on the server.
4. Run migrations and seeds, then run tests or start the server.
