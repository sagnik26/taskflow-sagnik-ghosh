# TaskFlow

## Overview

TaskFlow is a full-stack task management application: users can register, sign in, manage projects, and work with tasks (assignment, status, and filters are part of the product direction). The system is built for evaluation as a take-home exercise: it emphasizes a clear API, solid data modeling, Docker-based delivery, and maintainable structure.

**Stack (current direction):**

| Layer | Technology |
|--------|------------|
| API | Node.js 22, Express 5, TypeScript |
| Database | PostgreSQL 16, `node-pg-migrate` (SQL migrations) |
| Client | React, Vite, TypeScript |
| Ops | Docker Compose (API, SPA, Postgres, optional pgAdmin) |

---

## Architecture Decisions

- **Modular monolith (backend):** Domains such as auth, projects, and tasks are organized as vertical slices (routes, controllers, services, repositories, validators, and a small dependency container per module). Shared infrastructure (database pool, middleware, errors, logging, types) lives under `backend/shared/`. This keeps boundaries explicit without adopting a heavy DI framework.

- **TypeScript-only backend source:** Application code under `backend/` is authored as `.ts`. Production containers run compiled output from `dist/` (`tsc`). A separate **development** Docker image (`Dockerfile.dev`) installs full dependencies (including dev tools) and, when enabled, runs the API with **`tsx watch`** for reload-on-change; the production image uses a **multi-stage** build and **`npm ci --omit=dev`** for a smaller runtime.

- **Migrations at container start:** The backend entrypoint runs database migrations before starting the HTTP server so a fresh `docker compose up` does not require manual migration steps.

- **API error shape:** Operational errors are intended to flow through a shared `AppError` type and global error middleware so HTTP responses stay consistent (for example validation failures vs 401/403/404).

- **Frontend as a static SPA:** The frontend is built with Vite and served via nginx in Docker; the compose file wires default ports for the stack.

Further conventions and a fuller checklist for the submission live in [`AGENTS.md`](./AGENTS.md).

---

## Running Locally

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2
- [Git](https://git-scm.com/)

### Clone the repository

```bash
git clone <repository-url>
cd Greening-India-Assingment-TaskFlow
```

(Optional) Copy environment templates if you customize ports or secrets:

```bash
cp backend/.env.example backend/.env
```

Compose provides sensible defaults for Postgres; adjust variables in `.env` at the **repository root** if you use a root-level env file with Compose, or rely on the defaults in `docker-compose.yml`.

### Full stack with Docker (recommended)

From the **repository root**:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000) (maps to nginx in the `frontend` service)
- **Backend API:** [http://localhost:4000](http://localhost:4000) (e.g. `GET http://localhost:4000/health`)
- **PostgreSQL:** `localhost:5432` (default user/password/database: `postgres` / `postgres` / `taskflow`, overridable via Compose env)
- **pgAdmin (optional):** [http://localhost:8080](http://localhost:8080) (default login in `docker-compose.yml`: `admin@example.com` / `admin`)

Detached mode:

```bash
docker compose up --build -d
```

View logs:

```bash
docker compose logs -f backend
```

Stop and remove containers (keeps the Postgres volume by default):

```bash
docker compose down
```

### Dev backend image (TypeScript watch inside Docker)

Use the same base compose file plus the dev override so the backend is built from `Dockerfile.dev` and runs with reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Rebuild only the backend image without cache (useful after changing `scripts/entrypoint.sh` or Dockerfiles):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache backend
```

### Running backend and frontend on the host (without Docker)

You need a running PostgreSQL instance and `DATABASE_URL` set for the backend.

**Backend:**

```bash
cd backend
npm install
cp .env.example .env   # edit DATABASE_URL and JWT_SECRET as needed
npm run migrate
npm run build
npm start               # serves compiled output from dist/
```

Or, for development with reload (no Docker):

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run dev             # tsx watch server.ts
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server URL is printed in the terminal (commonly `http://localhost:5173`). Point the app at your API base URL as required for your setup.
