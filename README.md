# StudySync

StudySync is a role based learning workspace for students, teachers, and administrators. The frontend is a React 19 and Vite single page app; the API is an Express service backed by PostgreSQL.

## Screenshots

The public home page and authenticated dashboards are rendered from live app data, so screenshots depend on a running API and seeded database. To capture the current UI locally, open the frontend at `http://localhost:5173` and save screenshots into `docs/screenshots/` (for example `home.png`, `student-dashboard.png`, and `mobile.png`). Capture the dashboard after signing in with a seeded account for the relevant role.

## Requirements

- Node.js 20 or newer and npm
- PostgreSQL 14 or newer
- A Gemini API key for the server-side student assistant

## Run the project

### 1. Configure and start the API

Follow [the backend setup guide](back_end/README.md) to configure `.env`, create the database, migrate and seed it, then start the API on `http://localhost:3000`.

### 2. Configure and start the frontend

In a second terminal, from `front_end`:

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

The Vite server is available at `http://localhost:5173`. The default `VITE_API_URL` is `http://localhost:3000/api`; change it in `front_end/.env` if the API runs elsewhere. Configure `GEMINI_API_KEY` in `back_end/.env`; the key stays on the server and is never sent to the browser.

### 3. Build for production

From `front_end`:

```powershell
npm run build
npm run preview
```

## Frontend behavior

- Student, teacher, and administrator route groups are role guarded. The API independently enforces authorization.
- Theme preference is stored in `localStorage`; the toggle is available in public navigation and the signed-in workspace.
- Signing out removes authentication and application data from local and session storage while preserving the appearance preference.
- Lazy routes display a loading indicator. Data views use skeletons, empty states, and request error toasts.
- A rendering error boundary, not found page, and forbidden page provide recovery paths for navigation and rendering errors.
- The student AI assistant accepts PDF, DOCX, and TXT attachments and answers questions using their readable text.

## Responsive review widths

The interface uses responsive Tailwind breakpoints. Review the main landing page, sign-in form, a dashboard, tables, charts, and dialogs at 375 px (mobile), 768 px (tablet), and 1440 px (desktop). On narrow screens, the dashboard navigation collapses behind the menu button; content grids stack and wide tables should remain usable without forcing page-level horizontal scrolling.

## Project directories

- `front_end/src/pages`: public, student, teacher, and administrator screens
- `front_end/src/routes`: route definitions and role guards
- `front_end/src/context`: authentication and theme state
- `back_end/src`: API implementation
- `back_end/db`: migrations and seed data
- `back_end/docs`: API and data model documentation
