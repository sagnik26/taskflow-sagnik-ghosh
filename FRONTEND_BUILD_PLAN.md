# TaskFlow Frontend Build Plan

This plan is derived from `AGENTS.md` and is intended to be executed top-to-bottom to build the frontend in a way that matches the assignment rubric and required architecture.

---

## Goals and Non-Negotiables (from `AGENTS.md`)

- **Framework/stack**: React 18 + TypeScript + Vite + MUI, `react-router-dom` v6, axios.
- **Server state**: **TanStack Query** for all server-fetched data (projects, project detail, task lists, assignees).
- **Client/UI state**: **Zustand** only for UI state (modals, filters UI toggles) and auth session persistence (**user state**, not JWT storage).
- **Auth**:
  - **JWT is stored in an HttpOnly cookie** (frontend must not read or store the token).
  - Persist auth across refresh by **loading the current session user** on app start (requires `GET /auth/profile`).
  - Protected routes redirect to `/login` when unauthenticated.
  - Axios sends cookies with requests (`withCredentials: true`).
  - Axios response interceptor redirects to `/login` on **401**.
- **UX**:
  - Loading, error, and empty states must be visible (no blank screens, no `undefined` rendering).
  - **Optimistic UI** for task status changes; revert on error.
- **Design**:
  - Use **MUI**; responsive at **375px** and **1280px**.
  - No console errors in production build.

---

## Target UI Routes (React Router v6)

- **Public**
  - `/login` → `LoginPage`
  - `/register` → `RegisterPage`
- **Protected**
  - `/` → redirect to `/projects`
  - `/projects` → `ProjectsListPage`
  - `/projects/:id` → `ProjectDetailPage`
- **Fallback**
  - `*` → Not found page (simple MUI empty state)

Route protection must be via a shared layout component: `src/shared/layouts/ProtectedRoute.tsx`.

---

## File/Module Structure (must match)

Ensure the frontend code is organized as:

```
frontend/src/
  app/App.tsx
  api/client.ts
  api/errors.ts
  store/index.ts
  modules/auth/*
  modules/projects/*
  modules/tasks/*
  shared/components/{LoadingState,ErrorState,EmptyState}.tsx
  shared/layouts/{Navbar,ProtectedRoute}.tsx
  shared/providers/AuthProvider.tsx
```

Keep module concerns co-located: page + API calls + types (and zod schemas for forms) live together.

---

## Build Steps (Implementation Order)

This plan is split into two phases:

- **Phase A — UI build (no real backend calls yet)**: build pages/components with realistic mock data and consistent loading/error/empty states.
- **Phase B — API integration (axios + TanStack Query)**: wire up real endpoints, auth cookie flow, caching/invalidation, and optimistic updates.

---

## Phase A — Build the UI (mock data first)

### A1) Project wiring: providers + router shell (UI-only)

- **Add providers** in `src/main.tsx`:
  - MUI `ThemeProvider` + `CssBaseline`
  - TanStack Query `QueryClientProvider`
  - `AuthProvider`
  - `BrowserRouter`
- Implement `src/app/App.tsx`:
  - App shell layout (top-level `Navbar` on protected pages)
  - Router definition (public + protected)
  - Add a simple “NotFound” route using `EmptyState`

Acceptance checks:
- App boots without console errors.
- Navigating to `/projects` while logged out redirects to `/login`.

---

### A2) Shared UI states + layout building blocks

Deliverables:
- `src/shared/components/LoadingState.tsx`
- `src/shared/components/ErrorState.tsx`
- `src/shared/components/EmptyState.tsx`
- `src/shared/layouts/Navbar.tsx`
  - Shows current user name (from auth context)
  - Logout action
- `src/shared/layouts/ProtectedRoute.tsx`
  - Redirects to `/login` if unauthenticated

Acceptance checks:
- All pages can display loading/error/empty in a consistent style.

---

### A3) Auth pages UI: Login + Register (zod-validated forms, mock submit)

Deliverables:
- `src/modules/auth/auth.types.ts`
  - `User`, `AuthSession` (**user only; token is not accessible**)
- `src/modules/auth/auth.schemas.ts` (zod)
  - `loginSchema`, `registerSchema`
- `src/modules/auth/LoginPage.tsx`
- `src/modules/auth/RegisterPage.tsx`

UI/UX requirements:
- Inline field errors from zod validation before submit.
- Submit button shows loading state.
- Errors are visible (page-level alert and/or field helper text).

Mock behavior (until Phase B):
- On “successful” submit, navigate to `/projects`.
- Use a temporary in-memory user object in auth context so Navbar can render.

Acceptance checks:
- Both pages work with keyboard-only (tab/enter).
- No blank screens; loading and error states are visible.

---

### A4) Projects UI: list + create project modal (mock data)

Deliverables:
- `src/modules/projects/projects.types.ts`
- `src/modules/projects/ProjectsListPage.tsx`
  - Renders a responsive list/grid
  - Visible empty state when no projects
  - “Create Project” button opens modal
- `src/modules/projects/CreateProjectModal.tsx`
  - MUI form; validate required fields client-side

Mock behavior (until Phase B):
- Store mock projects in component state (or a small local mock module).
- “Create” appends to the list and closes the modal.

Acceptance checks:
- Empty → filled → empty states all look intentional.
- Modal UX works on mobile widths.

---

### A5) Project detail UI: tasks view + filters + task modal (mock data)

Deliverables:
- `src/modules/projects/ProjectDetailPage.tsx`
  - Renders project header + tasks section
  - Includes `TaskFilters` and `TaskList`
- `src/modules/tasks/TaskFilters.tsx`
  - Status filter (todo / in_progress / done)
  - Assignee filter (start with “All / Me / Unassigned”)
- `src/modules/tasks/TaskList.tsx`
  - List or grouped view; responsive
- `src/modules/tasks/TaskModal.tsx`
  - Create + edit modes
  - Fields: title, status, priority, assignee, due date, description (if supported)

Mock behavior (until Phase B):
- Filter tasks in memory.
- Allow changing task status locally to simulate optimistic updates (instant UI).

Acceptance checks:
- Filters change the list predictably.
- Task modal works on mobile and desktop.

---

## Phase B — API integration (axios + TanStack Query + cookie auth)

### B1) Auth foundation: context + API client interceptors

Implement auth in a way that supports:
- Register / login flows
- **Cookie-based session** (HttpOnly JWT cookie)
- Persisting login across refresh by fetching the current user on app start
- Programmatic logout on 401 (and via explicit logout action)

Deliverables:
- `src/modules/auth/AuthContext.tsx`
  - `useAuth()` hook
  - `login()`, `register()`, `logout()`
  - `isAuthenticated` derived value
  - `bootstrap()` (or equivalent) that calls `GET /auth/profile` on app load to set the user
- `src/shared/providers/AuthProvider.tsx`
  - Auth context provider wiring at app root
- `src/api/client.ts`
  - axios instance with base URL aligned to nginx proxy (`/api`) in Docker
  - `withCredentials: true` so cookies are sent
  - response interceptor: on 401 → clear user session in memory + redirect to `/login`
- `src/api/errors.ts`
  - Normalize backend error formats:
    - `{"error":"validation failed","fields":{...}}`
    - `{"error":"unauthorized"}`
    - `{"error":"forbidden"}`
    - `{"error":"not found"}`

Acceptance checks:
- Successful login survives refresh (because `/auth/profile` restores the user).
- Invalid credentials show a visible error message (not a silent failure).

---

### B2) Auth API: wire Login/Register (real calls)

Deliverables:
- `src/modules/auth/auth.api.ts`
  - `register(payload)` → `POST /auth/register`
  - `login(payload)` → `POST /auth/login`

UX requirements:
- Inline field errors from zod validation before submit.
- Submit button shows loading state.
- On success: redirect to `/projects`.

Acceptance checks:
- Both pages work with keyboard-only (tab/enter).
- On validation errors: show field-level helper text.

---

### B3) Projects API: list + create (TanStack Query)

API contract (backend):
- `GET /projects`
- `POST /projects`

Deliverables:
- `src/modules/projects/projects.api.ts`
- `src/modules/projects/ProjectsListPage.tsx`
  - Uses TanStack Query for list (`useQuery`)
  - Has “Create Project” button
  - Uses `CreateProjectModal`
  - Visible empty state when no projects
- `src/modules/projects/CreateProjectModal.tsx`
  - Form (MUI) with validation (zod optional; if used, place schema in module)
  - On success: close modal + invalidate projects query

State rules:
- Server list stays in TanStack Query cache.
- Modal open/close can be local component state or Zustand (if you want global UI control).

Acceptance checks:
- Creating a project updates list immediately (via invalidation/refetch).
- Errors show in modal (or as page-level alert).

---

### B4) Project detail + tasks API: fetch + filter (TanStack Query)

API contract (backend):
- `GET /projects/:id` (project details + tasks) OR fetch detail + tasks separately (either is acceptable; prefer one request if backend supports it)
- `GET /projects/:id/tasks?status=&assignee=`

Note (route mounting):
- In the current backend, the tasks router is mounted at the app root (not under `/tasks`), so task list/create endpoints are exactly `/projects/:id/tasks`.

Deliverables:
- `src/modules/projects/ProjectDetailPage.tsx`
  - Fetch project info and tasks with TanStack Query
  - Visible loading/error/empty states
  - Includes `TaskFilters` and `TaskList`
- `src/modules/tasks/TaskFilters.tsx`
  - Status filter (todo / in_progress / done)
  - Assignee filter (user list: you can start with “Me / Unassigned / All” depending on backend availability)
- `src/modules/tasks/TaskList.tsx`
  - Grouped or list view (either is fine); must be responsive

Acceptance checks:
- Filters update the displayed tasks reliably (query key includes filters).

---

### B5) Tasks API: create/edit/delete + optimistic status updates

API contract (backend):
- `POST /projects/:id/tasks`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

Note (route mounting):
- In the current backend, update/delete endpoints are exactly `/tasks/:id` (the tasks router is mounted at the app root).

Deliverables:
- `src/modules/tasks/tasks.types.ts`
- `src/modules/tasks/task.schemas.ts` (zod for create/edit)
- `src/modules/tasks/tasks.api.ts`
  - `list(projectId, filters)`
  - `create(projectId, payload)`
  - `update(taskId, patch)`
  - `remove(taskId)`
- `src/modules/tasks/TaskModal.tsx`
  - Create + edit modes
  - Fields: title, status, priority, assignee, due date, description (if supported)

Optimistic UI requirement:
- For task **status** changes (e.g., dropdown or quick action):
  - Use `useMutation` with `onMutate` to optimistically update cached tasks
  - On error: rollback to previous cache snapshot and show an error toast/alert
  - On success: invalidate/refetch as needed

Authorization UX:
- If backend returns `403`, show “forbidden” meaningfully (e.g., “You don’t have permission to do that”).

Acceptance checks:
- Status change feels instant, and rolls back correctly on simulated failure.

---

### B6) Error-handling contract alignment

Backend error formats are strict; frontend should map them to UI:

- **400** `validation failed` → show field errors when possible
- **401** `unauthorized` → logout + redirect to `/login`
- **403** `forbidden` → show a visible “forbidden” message, do not redirect
- **404** `not found` → show not-found state

Acceptance checks:
- 401 and 403 are not conflated in behavior.

---

### B7) Docker / nginx integration check

The frontend container (nginx) must proxy `/api/*` to backend.

Implementation rules:
- axios base URL should be `/api` (relative), so it works in Docker and local nginx routing.
- Confirm SPA routing fallback is configured in `frontend/nginx.conf` so deep links like `/projects/<id>` work on refresh.

Acceptance checks:
- `docker compose up` → open frontend → login works and API requests succeed via `/api`.

---

## Query Key Design (TanStack Query)

Use stable, explicit query keys to enable targeted invalidation:

- `["projects"]`
- `["project", projectId]`
- `["tasks", projectId, { status, assignee }]`

When mutations succeed:
- Create project → invalidate `["projects"]`
- Create/update/delete task → invalidate `["tasks", projectId, ...]` and/or `["project", projectId]` depending on what the page uses

---

## Minimum Feature Checklist (Definition of Done)

- **Auth**
  - Register + login, persists across refresh, logout works
  - Protected routes enforced
- **Projects**
  - List projects + create project
- **Project detail**
  - Show tasks, filter by status and assignee
- **Tasks**
  - Create/edit in modal/side panel
  - Update status with optimistic UI + rollback
- **Quality**
  - Loading/error/empty states present everywhere
  - Responsive layout at 375px and 1280px
  - No console errors in production build

---

## Nice-to-Haves (from `AGENTS.md` bonus list)

Only after the above is solid:

- Pagination support if backend adds `?page=&limit=`
- Drag-and-drop status changes (Kanban)
- Dark mode toggle that persists across sessions

