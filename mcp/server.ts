#!/usr/bin/env node
/**
 * ProjManager MCP server (stdio).
 * Talks to a running ProjManager instance via /api/v1.
 *
 * Env:
 *   PROJMANAGER_URL   e.g. https://pmkiller.claptac.dev  (or http://localhost:3000)
 *   MCP_API_KEY       personal token from Integrations (pmk_…) — preferred
 *                     OR shared server MCP_API_KEY (legacy; then set MCP_ACT_AS_EMAIL)
 *   MCP_ACT_AS_EMAIL  only needed for legacy shared key
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const baseUrl = (process.env.PROJMANAGER_URL ?? "http://localhost:3000").replace(/\/$/, "");
const apiKey = process.env.MCP_API_KEY ?? "";
const actAs = process.env.MCP_ACT_AS_EMAIL ?? "";

async function api(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<unknown> {
  if (!apiKey) {
    throw new Error(
      "MCP_API_KEY is required (create a personal pmk_ token on /integrations while logged in)",
    );
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  // Personal tokens already bind identity — only send Act-As for legacy shared keys
  if (actAs && !apiKey.startsWith("pmk_")) headers["X-Act-As-Email"] = actAs;
  if (init.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) {
    throw new Error(
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : `HTTP ${res.status}: ${text.slice(0, 300)}`,
    );
  }
  return data;
}

function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true as const,
  };
}

const server = new McpServer({
  name: "projmanager",
  version: "0.1.0",
});

server.registerTool(
  "list_projects",
  {
    description: "List ProjManager projects in the actor's organization.",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      return ok(await api("/api/v1/projects"));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "list_issues",
  {
    description:
      "List issues for a project (id or key like WEB). Filter by status, sprint, assignee, or search.",
    inputSchema: z.object({
      project: z.string().describe("Project id or key (e.g. WEB)"),
      status: z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"])
        .optional(),
      sprintId: z.string().optional(),
      assigneeEmail: z.string().email().optional(),
      q: z.string().optional().describe("Search title or issue key"),
    }),
  },
  async (args) => {
    try {
      const sp = new URLSearchParams();
      if (args.status) sp.set("status", args.status);
      if (args.sprintId) sp.set("sprintId", args.sprintId);
      if (args.assigneeEmail) sp.set("assigneeEmail", args.assigneeEmail);
      if (args.q) sp.set("q", args.q);
      const q = sp.toString();
      return ok(
        await api(`/api/v1/projects/${encodeURIComponent(args.project)}/issues${q ? `?${q}` : ""}`),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "create_issue",
  {
    description: "Create a backlog/board issue (story, task, bug, etc.) and optionally assign it.",
    inputSchema: z.object({
      project: z.string().describe("Project id or key"),
      title: z.string().min(1),
      description: z.string().optional(),
      issueType: z.enum(["EPIC", "STORY", "TASK", "BUG", "SUBTASK"]).optional(),
      severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
      status: z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"])
        .optional(),
      storyPoints: z.number().optional(),
      assigneeEmail: z.string().email().optional(),
      sprintId: z.string().optional(),
    }),
  },
  async (args) => {
    try {
      const { project, ...body } = args;
      return ok(
        await api(`/api/v1/projects/${encodeURIComponent(project)}/issues`, {
          method: "POST",
          json: body,
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "update_issue",
  {
    description:
      "Update an issue by key (e.g. WEB-12): status, assignee, sprint, points, severity, title.",
    inputSchema: z.object({
      issueKey: z.string().describe("Issue key like WEB-12"),
      title: z.string().optional(),
      status: z
        .enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE"])
        .optional(),
      severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
      storyPoints: z.number().nullable().optional(),
      assigneeEmail: z.string().email().nullable().optional(),
      sprintId: z.string().nullable().optional(),
    }),
  },
  async (args) => {
    try {
      const { issueKey, ...body } = args;
      return ok(
        await api(`/api/v1/issues/${encodeURIComponent(issueKey)}`, {
          method: "PATCH",
          json: body,
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "list_sprints",
  {
    description: "List sprints for a project (planned / active / closed).",
    inputSchema: z.object({
      project: z.string().describe("Project id or key"),
    }),
  },
  async (args) => {
    try {
      return ok(
        await api(`/api/v1/projects/${encodeURIComponent(args.project)}/sprints`),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "create_sprint",
  {
    description: "Create a planned sprint (PM+). Use start_sprint to activate it.",
    inputSchema: z.object({
      project: z.string(),
      name: z.string().min(2),
      goal: z.string().optional(),
      startDate: z.string().optional().describe("ISO date"),
      endDate: z.string().optional().describe("ISO date"),
    }),
  },
  async (args) => {
    try {
      const { project, ...body } = args;
      return ok(
        await api(`/api/v1/projects/${encodeURIComponent(project)}/sprints`, {
          method: "POST",
          json: body,
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "start_sprint",
  {
    description: "Start a sprint (marks it ACTIVE; closes any other active sprint on the project).",
    inputSchema: z.object({
      sprintId: z.string(),
    }),
  },
  async (args) => {
    try {
      return ok(
        await api(`/api/v1/sprints/${encodeURIComponent(args.sprintId)}/status`, {
          method: "POST",
          json: { status: "ACTIVE" },
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "complete_sprint",
  {
    description: "Complete/close a sprint.",
    inputSchema: z.object({
      sprintId: z.string(),
    }),
  },
  async (args) => {
    try {
      return ok(
        await api(`/api/v1/sprints/${encodeURIComponent(args.sprintId)}/status`, {
          method: "POST",
          json: { status: "CLOSED" },
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "reset_project_planning",
  {
    description:
      "Remove all issues and sprints from a project (PM+). Keeps the project; resets issue numbering.",
    inputSchema: z.object({
      project: z.string().describe("Project id or key (e.g. M)"),
    }),
  },
  async (args) => {
    try {
      return ok(
        await api(`/api/v1/projects/${encodeURIComponent(args.project)}/reset-planning`, {
          method: "POST",
        }),
      );
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerTool(
  "my_work",
  {
    description: "List open issues assigned to the MCP actor (planning / daily standup).",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      return ok(await api("/api/v1/me/work"));
    } catch (e) {
      return fail(e);
    }
  },
);

server.registerPrompt(
  "plan_sprint",
  {
    description: "Guide for planning a sprint from the backlog using ProjManager tools.",
    argsSchema: {
      project: z.string().describe("Project key, e.g. WEB"),
      capacityPoints: z.string().optional().describe("Team capacity in story points"),
    },
  },
  ({ project, capacityPoints }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `Plan the next sprint for project ${project}.`,
            capacityPoints ? `Team capacity: ${capacityPoints} story points.` : null,
            "1) list_sprints / create_sprint if needed",
            "2) list_issues with status BACKLOG",
            "3) pick a coherent slice, update_issue to assign sprintId + story points + owners",
            "4) start_sprint when the plan is ready",
            "Keep PR-ready issue keys (e.g. WEB-12) in titles when summarizing.",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
