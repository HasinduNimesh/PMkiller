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

1. Create a Neon project and copy the pooled connection string into `DATABASE_URL`.
2. Set `AUTH_SECRET` (`openssl rand -base64 32`) and `AUTH_URL` to your production URL.
3. Run migrations against Neon (`pnpm db:push` or `prisma migrate deploy`).
4. Deploy the repo to Vercel; add the same env vars in the project settings.

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
| `pnpm db:studio` | Prisma Studio |
