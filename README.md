# ProjManager

Company project manager with **RBAC**, **severity-based tasks**, **deadlines**, and **Critical Path Method (CPM)** scheduling.

Built for **Vercel** + **Neon (Postgres)**. Marketing landing at `/` uses the same **daisyUI** `corporate` theme as the app.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS + [daisyUI](https://daisyui.com)
- Auth.js (credentials) with org roles: `ADMIN` · `PM` · `MEMBER` · `VIEWER`
- Prisma + Postgres (Neon in production)
- CPM engine (finish-to-start) with Gantt + ES/EF/LS/LF/slack

### daisyUI + Cursor plugin

UI uses daisyUI themes (`corporate` default; switcher for Business / Emerald / Nord).

To get daisyUI component guidance in Cursor Agent Mode, install the official plugin:

1. Cursor Settings → **Plugins**
2. Search `https://github.com/saadeghi/daisyui`
3. Add **daisyui**, then prompt with `/daisyui …`

Optional: [Blueprint MCP](https://daisyui.com/docs/mcp/cursor/) for on-demand snippets (license required).

## Features (v1 + Jira-style)

- Organizations (multi-tenant-ready schema) + RBAC
- Projects with keys (`WEB-12`), deadlines, CPM health
- **Issue types**: Epic, Story, Task, Bug, Sub-task
- **Workflow statuses**: Backlog → To do → In progress → In review → Blocked → Done
- **Kanban board** (drag & drop) + **Backlog / Sprint planning**
- Epics, roadmap, labels, components, versions/releases
- Story points, estimates, due dates, environment (bugs)
- Watchers, comments, activity history
- **Org admin: add / remove users** with roles
- **GitHub webhook**: mention `PROJ-12` in PR title/body → auto-mark DONE on merge
- Filters on issue list (type / status / priority / search)
- My work (assigned + watching)
- CPM schedule (finish-to-start dependencies)

### GitHub setup (per project)

**Recommended — Connect with GitHub (OAuth)**

1. Create a GitHub OAuth App: [Developer settings](https://github.com/settings/developers)
   - Homepage URL: your app URL
   - Authorization callback URL: `https://YOUR_APP/api/github/oauth/callback`
2. Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `AUTH_URL` in env.
3. Project → **Settings** → **Connect GitHub** → authorize → pick a repo.
4. ProjManager creates the webhook automatically.

**PR titles** still need issue keys, e.g. `Fix WEB-12 login` or `Closes WEB-12, WEB-15`.

Manual webhook setup remains available under **Manual webhook setup (advanced)**.

## Local setup

### 1. Dependencies

```bash
pnpm install
```

### 2. Database

Use Neon, or a local Postgres (a Docker example is already used in development):

```bash
docker run -d --name proj-manager-pg \
  -e POSTGRES_USER=proj -e POSTGRES_PASSWORD=proj -e POSTGRES_DB=proj_manager \
  -p 5433:5432 postgres:16-alpine
```

Copy env and set `DATABASE_URL` / `AUTH_SECRET`:

```bash
cp .env.example .env
```

### 3. Migrate + seed

```bash
pnpm db:push
pnpm db:seed
```

Demo users (password `password123`):

| Email | Role |
|-------|------|
| admin@acme.test | ADMIN |
| pm@acme.test | PM |
| member@acme.test | MEMBER |

### 4. Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel + Neon)

1. In Neon → **Connect**, copy the **pooled** URL (`-pooler` in the hostname) into Vercel `DATABASE_URL`.
2. Make sure the URL ends with (or includes) these query params — Neon cold starts often exceed Prisma’s default 5s:

```text
?sslmode=require&pgbouncer=true&connect_timeout=15&pool_timeout=15
```

3. Set `AUTH_SECRET` (`openssl rand -base64 32`) for **Production**.
4. Optionally set `AUTH_URL` to `https://YOUR_APP.vercel.app`, or leave unset (not `localhost`).
5. Push schema once from your machine against Neon:

```bash
DATABASE_URL="your-neon-url-with-params" pnpm db:push
```

6. **Redeploy** after every env change.

### If logs say `Can't reach database server`

| Check | What to do |
|-------|------------|
| Neon project asleep / suspended | Open the Neon console (wakes compute), then retry |
| Timeouts too short | Add `connect_timeout=15&pool_timeout=15` to `DATABASE_URL` |
| Wrong / stale password | Reset role password in Neon, update Vercel, redeploy |
| Schema never applied | Run `pnpm db:push` with the Neon `DATABASE_URL` |

## MCP (Cursor / agents)

ProjManager exposes a **scrum API** at `/api/v1/*` plus a **stdio MCP server** so agents can plan sprints, create/assign issues, and move work.

### 1. Server env (Vercel or local)

| Variable | Purpose |
|----------|---------|
| `MCP_API_KEY` | Shared bearer secret (`openssl rand -base64 32`) |
| `MCP_ACT_AS_EMAIL` | Org user the MCP acts as (e.g. `admin@acme.test`) |

### 2. Cursor MCP config

Copy `mcp/cursor.mcp.example.json` into your Cursor MCP settings (or project `.cursor/mcp.json`) and set:

- `PROJMANAGER_URL` → `https://pmkiller.vercel.app` (or `http://localhost:3000`)
- `MCP_API_KEY` → same as server
- `MCP_ACT_AS_EMAIL` → your org member email
- `cwd` → this repo path

### 3. Tools

`list_projects`, `list_issues`, `create_issue`, `update_issue`, `list_sprints`, `create_sprint`, `start_sprint`, `complete_sprint`, `my_work`, plus prompt `plan_sprint`.

Example: *“Plan Sprint 2 for WEB at 20 points, assign bugs to member@acme.test, then start the sprint.”*

## CPM notes

- Dependencies are **finish-to-start (FS)**.
- Durations are calendar days (v1).
- Tasks with **zero slack** form the critical path (rose on the schedule view).
- Circular dependencies are rejected when recalculating.

## Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm test` | CPM unit tests |
| `pnpm db:seed` | Demo data |
| `pnpm mcp` | Run ProjManager MCP server (stdio) |
| `pnpm db:studio` | Prisma Studio |
