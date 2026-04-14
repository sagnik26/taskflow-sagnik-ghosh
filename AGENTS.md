# TaskFlow

> This file provides full context for AI-assisted development. Read this before making any changes.

---

## 1. What Is This Project?

**TaskFlow** is a full-stack task management system built as a take-home assignment for a **Full Stack Engineer** role. Users can register, log in, create projects, add tasks to projects, and assign tasks to themselves or others.

This is evaluated on: correctness, code quality, API design, data modeling, UI/UX, component design, Docker/DevEx, and README quality. **Minimum passing score: 28/45.**

### Automatic Disqualifiers (must avoid at all costs)

- App does not run with `docker compose up`
- No database migrations (manual SQL dumps do not count)
- Passwords stored in plaintext
- JWT secret hardcoded in source code (must come from `.env`)
- No README
- Submission after 72-hour deadline

---

## 2. Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Monorepo         | npm workspaces                      |
| Backend          | Node.js + Express + TypeScript      |
| Database         | PostgreSQL 16                       |
| Migrations       | node-pg-migrate (raw SQL, up/down)  |
| Auth             | bcrypt (cost ≥ 12) + jsonwebtoken   |
| Validation       | zod                                 |
| Logging          | pino (structured JSON)              |
| Frontend         | React 18 + TypeScript + Vite        |
| UI Library       | MUI (Material UI)                   |
| HTTP Client      | axios                               |
| Routing          | react-router-dom v6                 |
| Containerization | Docker multi-stage builds + Compose |

---

## 3. Architecture: Modular Monolith

The backend follows a **modular monolith** pattern (reference: [Intelligent-API-Monitoring-Platform](https://github.com/sagnik26/Intelligent-API-Monitoring-Platform)). Each domain (auth, projects, tasks) is a self-contained **vertical slice** with its own routes, controller, service, repository, validation, types, and a dependency injection container.

Cross-cutting infrastructure lives in `backend/src/shared/`. The main `backend/server.ts` composes the app by mounting module routers and shared middleware.

### 3.1 Directory Structure

```
taskflow/
├── docker-compose.yml
├── README.md
├── package.json                        # npm workspaces root
│
├── backend/
│   ├── Dockerfile                      # Multi-stage: build → minimal runtime
│   ├── scripts/
│   │   └── entrypoint.sh               # Runs migrations + seed → starts server
│   ├── .env.example                    # Backend / migrate env template
│   ├── package.json
│   ├── tsconfig.json
│   ├── migrations/                     # SQL migration files (up + down)
│   ├── seed.sql                        # Test data for evaluation
│   ├── server.ts                       # HTTP server, graceful shutdown on SIGTERM
│   │
│   └── src/
│       ├── app.ts                      # Express app setup, middleware registration
│       │
│       ├── config/
│       │   └── index.ts                # Env var loading + validation with zod
│       │
│       ├── shared/                     # Shared kernel (cross-cutting concerns)
│       │   ├── config/
│       │   │   ├── index.ts            # Global config (dotenv + default export) + re-exports logger
│       │   │   └── logger.ts           # Winston structured logger
│       │   ├── db/
│       │   │   ├── pool.ts             # pg Pool singleton
│       │   ├── middlewares/
│       │   │   ├── authenticate.ts     # JWT verification → sets req.user
│       │   │   ├── errorHandler.ts     # Global error handler
│       │   │   ├── requestLogger.ts    # HTTP request logging with pino
│       │   │   └── validate.ts         # Zod schema validation middleware
│       │   ├── utils/
│       │   │   ├── AppError.ts         # Custom error class hierarchy
│       │   │   └── ResponseFormatter.ts # Consistent API response formatting
│       │   ├── constants/
│       │   │   └── index.ts            # Shared enums and constants
│       │   └── types/
│       │       └── index.ts            # Shared types (AuthRequest, etc.)
│       │
│       └── modules/
│           ├── auth/
│           │   ├── routes/
│           │   │   └── auth.routes.ts
│           │   ├── controllers/
│           │   │   └── auth.controller.ts
│           │   ├── services/
│           │   │   └── auth.service.ts
│           │   ├── repositories/
│           │   │   ├── BaseRepository.ts
│           │   │   └── auth.repository.ts
│           │   ├── validators/
│           │   │   └── auth.validator.ts
│           │   ├── types/
│           │   │   └── auth.types.ts
│           │   └── dependencies/
│           │       └── auth.dependencies.ts
│           │
│           ├── projects/
│           │   ├── projects.routes.ts
│           │   ├── projects.controller.ts
│           │   ├── projects.service.ts
│           │   ├── projects.repository.ts
│           │   ├── projects.validator.ts
│           │   ├── projects.types.ts
│           │   └── projects.dependencies.ts
│           │
│           └── tasks/
│               ├── tasks.routes.ts
│               ├── tasks.controller.ts
│               ├── tasks.service.ts
│               ├── tasks.repository.ts
│               ├── tasks.validator.ts
│               ├── tasks.types.ts
│               └── tasks.dependencies.ts
│
├── frontend/
│   ├── Dockerfile                      # Multi-stage: Vite build → nginx
│   ├── nginx.conf                      # SPA routing + API proxy
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── index.css
│       │
│       ├── app/
│       │   ├── App.tsx                 # App shell (providers + layout)
│       │   └── App.css
│       │
│       ├── api/
│       │   ├── client.ts               # Axios instance + JWT + 401 handling
│       │   └── errors.ts               # API error normalization helpers
│       │
│       ├── store/                      # Zustand stores (client/UI state only)
│       │   └── index.ts
│       │
│       ├── modules/
│       │   ├── auth/
│       │   │   ├── AuthContext.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   ├── RegisterPage.tsx
│       │   │   ├── auth.api.ts
│       │   │   ├── auth.schemas.ts     # zod schemas for forms
│       │   │   └── auth.types.ts
│       │   ├── projects/
│       │   │   ├── ProjectsListPage.tsx
│       │   │   ├── ProjectDetailPage.tsx
│       │   │   ├── CreateProjectModal.tsx
│       │   │   ├── projects.api.ts
│       │   │   └── projects.types.ts
│       │   └── tasks/
│       │       ├── TaskList.tsx
│       │       ├── TaskModal.tsx
│       │       ├── TaskFilters.tsx
│       │       ├── tasks.api.ts
│       │       ├── tasks.types.ts
│       │       └── task.schemas.ts     # zod schemas for create/edit
│       │
│       └── shared/
│           ├── components/             # Reusable UI + app states
│           │   └── ui/                 # MUI-based wrappers (optional)
│           ├── hooks/                  # useAsync, useDebounce, etc.
│           ├── layouts/
│           │   ├── ProtectedRoute.tsx
│           │   └── Navbar.tsx
│           ├── providers/
│           │   └── AuthProvider.tsx    # App-level auth provider wiring
│           ├── types/
│           │   └── index.ts            # Central type exports
│           └── utils/
│               ├── cn.ts               # Tailwind class merge helper
│               └── dates.ts            # Date formatting/parsing helpers
```

---

## 4. Modular Monolith Patterns (MUST FOLLOW)

These patterns are derived from the reference architecture and adapted for TypeScript + PostgreSQL.

### 4.1 Dependency Injection Container

Every module has a `*.dependencies.ts` file that manually wires the dependency graph: **Repository → Service → Controller**. The router imports the composed controller from this file.

```typescript
// Example: auth.dependencies.ts
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { pool } from "../../../shared/db/pool";

class AuthContainer {
  static init() {
    const repositories = {
      authRepository: new AuthRepository(pool),
    };

    const services = {
      authService: new AuthService(repositories.authRepository),
    };

    const controllers = {
      authController: new AuthController(services.authService),
    };

    return { repositories, services, controllers };
  }
}

const authDeps = AuthContainer.init();
export default authDeps;
```

**Why this pattern:**

- No DI framework overhead — just simple constructor injection
- Easy to understand, test, and explain on a code review call
- Clear composition root per module
- Dependencies are explicit, never hidden behind decorators or magic

### 4.2 Base Repository (Abstract Class)

A `BaseRepository` lives **inside each module** under `modules/<module>/repositories/`. Concrete repositories extend it and implement domain-specific SQL using a shared `pg` Pool.

```typescript
// modules/auth/repositories/BaseRepository.ts
import type { Pool, QueryResult, QueryResultRow } from "pg";

export abstract class BaseRepository {
  constructor(protected readonly pool: Pool) {
    if (!pool) throw new Error("Pool is required");
  }

  protected async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }
}
```

**Concrete repository example:**

```typescript
// modules/auth/repositories/auth.repository.ts
import type { Pool, QueryResultRow } from "pg";

import { BaseRepository } from "./BaseRepository";
import type { CreateUserInput, PublicUser, UserRow } from "../types/auth.types";

export class AuthRepository extends BaseRepository {
  constructor(pool: Pool) {
    super(pool);
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await this.query<UserRow & QueryResultRow>(
      `SELECT id, name, email, password, created_at
       FROM users
       WHERE email = $1`,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async create(data: CreateUserInput): Promise<PublicUser> {
    const result = await this.query<PublicUser & QueryResultRow>(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [data.name, data.email, data.hashedPassword],
    );
    const row = result.rows[0];
    if (!row) throw new Error("Failed to create user");
    return { id: row.id, name: row.name, email: row.email };
  }
}
```

**Key rules:**

- Always use parameterized queries (`$1`, `$2`) — NEVER string concatenation
- Always return typed data, never `any` in final implementation
- Repository is the ONLY layer that writes SQL

### 4.3 Controller Pattern

Controllers handle HTTP concerns only: parse request, call service, format response. They receive the service via constructor injection.

```typescript
// auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ResponseFormatter } from "../../../shared/utils/ResponseFormatter";

export class AuthController {
  constructor(private authService: AuthService) {
    if (!authService) throw new Error("AuthService is required");
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const result = await this.authService.register({ name, email, password });
      res
        .status(201)
        .json(
          ResponseFormatter.success(
            result,
            "User registered successfully",
            201,
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res
        .status(200)
        .json(ResponseFormatter.success(result, "Login successful"));
    } catch (error) {
      next(error);
    }
  }
}
```

**Controller rules:**

- Every method wrapped in try-catch, errors forwarded via `next(error)`
- Never writes SQL or contains business logic
- Never directly imports repository — only talks to service
- Uses `ResponseFormatter` for all responses

### 4.4 Service Pattern

Services contain business logic, authorization checks, and orchestration. They receive repositories via constructor injection.

```typescript
// auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { AppError } from "../../../shared/utils/AppError";
import config from "../../../shared/config";
import logger from "../../../shared/config/logger";

export class AuthService {
  constructor(private authRepository: AuthRepository) {
    if (!authRepository) throw new Error("AuthRepository is required");
  }

  async register(data: RegisterDTO) {
    const existing = await this.authRepository.findByEmail(data.email);
    if (existing) throw new AppError("Email already exists", 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.authRepository.create({
      name: data.name,
      email: data.email,
      hashedPassword,
    });

    const token = this.generateToken(user);
    logger.info("User registered successfully", { email: user.email });

    return { user, token };
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { user_id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );
  }
}
```

**Service rules:**

- Contains ALL business logic (validation, authorization, data transformation)
- Never touches `req` or `res` objects
- Throws `AppError` for known error conditions
- Can import OTHER modules' services (never their repositories)

### 4.5 Router Pattern

Routers register endpoints and compose middleware chains. They import the controller from the dependencies container.

```typescript
// auth.routes.ts
import { Router } from "express";
import authDeps from "./auth.dependencies";
import { validate } from "../../../shared/middlewares/validate";
import { registerSchema, loginSchema } from "./auth.validator";

const router = Router();
const { authController } = authDeps.controllers;

router.post("/register", validate(registerSchema), (req, res, next) =>
  authController.register(req, res, next),
);

router.post("/login", validate(loginSchema), (req, res, next) =>
  authController.login(req, res, next),
);

export default router;
```

**Router rules:**

- NO business logic — only middleware composition
- Wrap controller calls in arrow functions to preserve `this` context
- Validation middleware runs BEFORE the controller
- Auth middleware (`authenticate`) applied to protected routes

### 4.6 Validation with Zod

Each module has a `*.validator.ts` with zod schemas. The shared `validate` middleware takes a zod schema and validates `req.body`.

```typescript
// auth.validator.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**Validate middleware:**

```typescript
// shared/middlewares/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path.join(".");
        fields[key] = err.message;
      });
      return res.status(400).json({ error: "validation failed", fields });
    }
    req.body = result.data; // Use parsed (sanitized) data
    next();
  };
```

### 4.7 AppError (Custom Error Class)

```typescript
// shared/utils/AppError.ts
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors: Record<string, string> | null;

  constructor(
    message: string,
    statusCode = 500,
    errors: Record<string, string> | null = null,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 4.8 ResponseFormatter (Consistent API Responses)

```typescript
// shared/utils/ResponseFormatter.ts
export class ResponseFormatter {
  static success(data: any, message = "Success", statusCode = 200) {
    return { success: true, message, data, statusCode };
  }

  static error(message = "Error", statusCode = 500, errors: any = null) {
    return { success: false, message, errors, statusCode };
  }

  static paginated(data: any, page: number, limit: number, total: number) {
    return {
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
```

### 4.9 Global Error Handler

```typescript
// shared/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import logger from "../config/logger";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    // Validation errors with fields
    if (err.statusCode === 400 && err.errors) {
      return res
        .status(400)
        .json({ error: "validation failed", fields: err.errors });
    }
    // All other operational errors
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown errors — don't leak details
  res.status(500).json({ error: "internal server error" });
};

export default errorHandler;
```

### 4.10 Module Communication Rules

- Modules **NEVER** import from another module's repository directly.
- If module A needs data from module B, it imports B's **service** through its public interface.
- The `src/shared/` folder is for infrastructure only (DB pool, middleware, config, types, utilities such as `AppError`). The logger module lives at `src/shared/config/logger.ts`.
- Example: `tasks.service.ts` can import `ProjectsService` to verify a project exists, but must NOT import `projects.repository.ts`.

```typescript
// ✅ CORRECT — tasks needs project data, imports the service
import { ProjectsService } from "../projects/projects.service";

// ❌ WRONG — never import another module's repository
import { ProjectsRepository } from "../projects/projects.repository";
```

When a module depends on another module's service, wire it through the dependencies container:

```typescript
// tasks.dependencies.ts
import projectsDeps from "../projects/projects.dependencies";

class TasksContainer {
  static init() {
    const repositories = { tasksRepository: new TasksRepository(pool) };
    const services = {
      tasksService: new TasksService(
        repositories.tasksRepository,
        projectsDeps.services.projectsService, // cross-module dependency
      ),
    };
    // ...
  }
}
```

### 4.11 Server Entrypoint Pattern

The `server.ts` follows the reference architecture pattern:

1. Initialize DB connections
2. Start HTTP server
3. Register graceful shutdown handlers for SIGTERM/SIGINT
4. Handle uncaught exceptions and unhandled rejections

```typescript
// server.ts
import app from "./src/app";
import config from "./src/shared/config";
import { pool } from "./src/shared/db/pool";
import logger from "./src/shared/config/logger";

async function startServer() {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connected");

    const server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`);
      logger.info(`Environment: ${config.node_env}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed");
        try {
          await pool.end();
          logger.info("All connections closed, exiting");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
```

### 4.12 App Composition Pattern

The `app.ts` composes the Express application by:

1. Registering global middleware (helmet, cors, json parser, request logger)
2. Mounting module routers under their respective paths
3. Adding 404 handler and global error handler LAST

```typescript
// app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import requestLogger from "./shared/middlewares/requestLogger";
import errorHandler from "./shared/middlewares/errorHandler";
import authRouter from "./modules/auth/routes/auth.routes";
import projectsRouter from "./modules/projects/projects.routes";
import tasksRouter from "./modules/tasks/tasks.routes";

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Module routers
app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/tasks", tasksRouter); // For PATCH/DELETE /tasks/:id

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
```

---

## 5. Database Schema

PostgreSQL with UUID primary keys. Schema managed via `node-pg-migrate` SQL migrations (never auto-migrate).

```sql
-- Users
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hashed, cost ≥ 12
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'todo'
              CHECK (status IN ('todo', 'in_progress', 'done')),
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('low', 'medium', 'high')),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by  UUID NOT NULL REFERENCES users(id),
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
```

**Note:** `created_by` is added to tasks so we can enforce the "project owner or task creator only" authorization rule for task deletion.

### Migration Rules

- Each migration has an **up** file (apply) and a **down** file (rollback).
- One migration = one logical change.
- Never edit a migration that has already been run.
- Migrations run automatically on container start via `scripts/entrypoint.sh`.

---

## 6. API Specification

Base URL: `http://localhost:4000`
All responses: `Content-Type: application/json`

### Authentication

| Method | Endpoint         | Auth | Description                         |
| ------ | ---------------- | ---- | ----------------------------------- |
| POST   | `/auth/register` | No   | Register with name, email, password |
| POST   | `/auth/login`    | No   | Returns JWT access token            |

- Passwords hashed with bcrypt, cost ≥ 12.
- JWT expires in 24 hours. Claims include `user_id` and `email`.
- All non-auth endpoints require `Authorization: Bearer <token>`.

**Register request/response:**

```json
// POST /auth/register
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123" }

// Response 201
{ "token": "<jwt>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } }
```

**Login request/response:**

```json
// POST /auth/login
// Request
{ "email": "jane@example.com", "password": "secret123" }

// Response 200
{ "token": "<jwt>", "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com" } }
```

### Projects

| Method | Endpoint        | Auth | Description                             |
| ------ | --------------- | ---- | --------------------------------------- |
| GET    | `/projects`     | Yes  | List projects user owns or has tasks in |
| POST   | `/projects`     | Yes  | Create project (owner = current user)   |
| GET    | `/projects/:id` | Yes  | Project details + its tasks             |
| PATCH  | `/projects/:id` | Yes  | Update name/description (owner only)    |
| DELETE | `/projects/:id` | Yes  | Delete project + all tasks (owner only) |

### Tasks

| Method | Endpoint              | Auth | Description                                              |
| ------ | --------------------- | ---- | -------------------------------------------------------- |
| GET    | `/projects/:id/tasks` | Yes  | List tasks. Supports `?status=` and `?assignee=` filters |
| POST   | `/projects/:id/tasks` | Yes  | Create a task in the project                             |
| PATCH  | `/tasks/:id`          | Yes  | Update task fields                                       |
| DELETE | `/tasks/:id`          | Yes  | Delete task (project owner or task creator only)         |

### Error Response Formats

The assignment requires these exact formats:

```json
// 400 — Validation error
{ "error": "validation failed", "fields": { "email": "is required" } }

// 401 — Unauthenticated (no token, expired token, invalid token)
{ "error": "unauthorized" }

// 403 — Forbidden (valid token, but not allowed to do this action)
{ "error": "forbidden" }

// 404 — Not found
{ "error": "not found" }
```

**CRITICAL:** 401 and 403 must NOT be conflated.

- 401 = "who are you?" (missing/expired/invalid token)
- 403 = "I know who you are, but you can't do this" (not the project owner, etc.)

---

## 7. Frontend Requirements

### Pages

| View             | Requirements                                                        |
| ---------------- | ------------------------------------------------------------------- |
| Login / Register | Form with client-side validation (zod), error handling, JWT storage |
| Projects list    | All accessible projects, create new project button                  |
| Project detail   | Tasks listed/grouped, filter by status and assignee                 |
| Task create/edit | Modal or side panel: title, status, priority, assignee, due date    |
| Navbar           | Logged-in user's name, logout button                                |

### UX Rules

- **React Router** for navigation.
- Auth state persists across page refreshes (localStorage).
- Protected routes redirect to `/login` if unauthenticated.
- **Loading states, error states, and empty states must be visible.** No silent failures. No blank screens. No `undefined` rendered.
- **Optimistic UI** for task status changes: update state immediately, revert on API error.

### Design Rules

- Use **MUI (Material UI)** as the design/component library.
- **Responsive:** must work at 375px (mobile) and 1280px (desktop).
- No broken layouts, no console errors in production build.
- Sensible empty states — no `undefined`, no blank white boxes.

### State Management

- **TanStack Query is required for server state** (projects, project detail, task lists, assignees): caching, invalidation, deduping, and consistent loading/error states.
- **Zustand is required for client/UI state** (modals, UI toggles, ephemeral selections, auth session persistence).
- **Do not store server-fetched lists in Zustand.** Keep server state in TanStack Query.

### Frontend Module Structure

Frontend mirrors the backend modular pattern:

```
src/
  app/
    App.tsx               — App shell (providers + layout)
    App.css

  api/
    client.ts             — Axios client + interceptors (JWT + 401)
    errors.ts             — API error normalization

  store/                  — Zustand stores (client/UI state only)
    index.ts

  modules/
    auth/
      AuthContext.tsx     — Auth state (user/token) + login/logout/register
      LoginPage.tsx       — Login page
      RegisterPage.tsx    — Register page
      auth.api.ts         — Auth API calls
      auth.schemas.ts     — zod schemas for forms
      auth.types.ts       — Types

    projects/
      ProjectsListPage.tsx   — Projects list page
      ProjectDetailPage.tsx  — Project detail page (tasks + filters)
      CreateProjectModal.tsx — Create project modal
      projects.api.ts        — Projects API calls
      projects.types.ts      — Types

    tasks/
      TaskList.tsx         — Task list/board
      TaskModal.tsx        — Create/edit task modal
      TaskFilters.tsx      — Status/assignee filters
      tasks.api.ts         — Tasks API calls
      tasks.types.ts       — Types
      task.schemas.ts      — zod schemas for create/edit

  shared/
    components/
      ui/                  — MUI wrappers (optional)
      EmptyState.tsx       — Standard empty state
      LoadingState.tsx     — Standard loading state
      ErrorState.tsx       — Standard error state
    hooks/
      useAsync.ts
      useDebounce.ts
    layouts/
      ProtectedRoute.tsx
      Navbar.tsx
    providers/
      AuthProvider.tsx     — App-level auth provider wiring
    types/
      index.ts             — Central type exports
    utils/
      cn.ts
      dates.ts
```

---

## 8. Docker & Infrastructure

### Requirements

- `docker compose up` from repo root must start the **full stack** (DB, API, frontend) with **zero manual steps**.
- PostgreSQL credentials configurable via `.env` (Compose root file and/or `backend/.env`).
- `backend/.env.example` committed with backend-required variables and sensible defaults.
- Both backend and frontend Dockerfiles use **multi-stage builds**.
- Migrations run **automatically** on container start.

### Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│  PostgreSQL   │
│  (nginx:80)  │     │ (express:4000)│     │   (:5432)    │
│  port 3000   │     │  port 4000   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
```

- Frontend nginx proxies `/api/*` to the backend container.
- Backend waits for DB health check before starting.
- Entrypoint script: run migrations → conditional seed → start server.

---

## 9. Seed Data

The seed script must create (for evaluator to log in immediately):

```
User:
  Email:    test@example.com
  Password: password123  (bcrypt hashed in seed.sql)

Project:
  Name: "Website Redesign"
  Description: "Q2 website redesign project"
  Owner: test user

Tasks (3, different statuses):
  1. "Design homepage"     — status: todo,        priority: high,   assignee: test user
  2. "Implement auth flow" — status: in_progress,  priority: medium, assignee: test user
  3. "Write API docs"      — status: done,         priority: low,    assignee: null
```

---

## 10. Coding Conventions

### Backend

- **TypeScript-only application source** — Author the backend as `.ts` only (`server.ts` and everything under `src/**/*.ts`). Do not add hand-written `.js` files for application code, middleware, errors, or logging. Node runs compiled output from `dist/` in production (`npm run build` then `npm start`). For local development without a rebuild loop, use `npm run dev` (`tsx watch server.ts`). Exceptions are limited to non-source files (for example `package.json`, shell scripts, SQL migrations, and generated artifacts).
- **TypeScript strict mode** — no `any` in final code.
- Use `async/await` everywhere, never raw callbacks.
- All controller methods wrapped in try-catch, errors forwarded via `next(error)`.
- SQL queries use parameterized queries (`$1`, `$2`) — NEVER string concatenation.
- Structured logging with pino: include relevant context (module, userId, action).
- Consistent error responses using `AppError` class.
- Graceful shutdown: close DB pool and HTTP server on SIGTERM/SIGINT.
- Constructor injection with guard clauses: `if (!dependency) throw new Error("X is required")`.

### Frontend

- Functional components with hooks only. No class components.
- Co-locate module files: page, api calls, and types live together under each module.
- Use `AuthContext` for auth state; no prop drilling for user/token.
- API client has a request interceptor that attaches the JWT automatically.
- API client has a response interceptor that redirects to `/login` on 401.
- All forms validate with zod schemas before submitting.
- Use TypeScript strictly — no `any` types.

### General

- No `console.log` in production code (use pino logger on backend).
- Prefer named exports over default exports (except for routers and pages).
- File naming: `module.layer.ts` for backend (e.g., `auth.service.ts`), `PascalCase.tsx` for React components.

---

## 11. Layer Responsibilities (Quick Reference)

| Layer        | Does                                                 | Does NOT                              |
| ------------ | ---------------------------------------------------- | ------------------------------------- |
| Routes       | Register endpoints, compose middleware chain         | Contain business logic                |
| Controller   | Parse HTTP request, call service, format response    | Write SQL, contain business logic     |
| Service      | Business logic, authorization, orchestration         | Touch `req`/`res`, write SQL directly |
| Repository   | Execute parameterized SQL queries, return typed data | Contain business rules                |
| Validator    | Define zod schemas for request body validation       | Contain logic or side effects         |
| Dependencies | Wire repo → service → controller (composition root)  | Contain any logic beyond wiring       |

---

## 12. Bonus Features (if time permits, in priority order)

1. Pagination on list endpoints (`?page=&limit=`)
2. `GET /projects/:id/stats` — task counts by status and by assignee
3. At least 3 integration tests for auth or task endpoints
4. Drag-and-drop to change task status (Kanban-style)
5. Dark mode toggle that persists across sessions

---

## 13. README Checklist

The README must include these sections (evaluated in rubric):

1. **Overview** — What this is, what it does, tech stack.
2. **Architecture Decisions** — Why modular monolith, why these tools, what tradeoffs. Mention the reference architecture pattern and how it was adapted for TypeScript + PostgreSQL.
3. **Running Locally** — Exact commands from `git clone` to app in browser.
4. **Running Migrations** — State they run automatically on container start.
5. **Test Credentials** — `test@example.com` / `password123`.
6. **API Reference** — All endpoints with request/response examples.
7. **What You'd Do With More Time** — Honest tradeoffs and improvements.
