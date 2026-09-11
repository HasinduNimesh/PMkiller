import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractIssueKeys, verifyGithubSignature } from "@/lib/github";

export const runtime = "nodejs";

type PullRequestPayload = {
  action?: string;
  pull_request?: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    merged: boolean;
    merged_at: string | null;
  };
  repository?: {
    full_name: string;
  };
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const event = req.headers.get("x-github-event");
  const signature = req.headers.get("x-hub-signature-256");

  let payload: PullRequestPayload & { zen?: string };
  try {
    payload = JSON.parse(rawBody) as PullRequestPayload & { zen?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const repo = payload.repository?.full_name;

  // Resolve project by repo + valid signature (supports multiple orgs linking same repo)
  async function matchProjectBySignature() {
    if (!repo) return null;
    const candidates = await prisma.project.findMany({
      where: {
        githubRepo: { equals: repo, mode: "insensitive" },
        githubWebhookSecret: { not: null },
      },
    });
    return (
      candidates.find(
        (p) =>
          p.githubWebhookSecret &&
          verifyGithubSignature(rawBody, signature, p.githubWebhookSecret),
      ) ?? null
    );
  }

  if (event === "ping") {
    if (repo) {
      const matched = await matchProjectBySignature();
      if (!matched && signature) {
        // Repo is linked somewhere but signature does not match any secret
        const linked = await prisma.project.count({
          where: {
            githubRepo: { equals: repo, mode: "insensitive" },
            githubWebhookSecret: { not: null },
          },
        });
        if (linked > 0) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }
    return NextResponse.json({ ok: true, message: "pong" });
  }

  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, ignored: true, event });
  }

  const pr = payload.pull_request;
  if (!repo || !pr) {
    return NextResponse.json({ error: "Missing repository or pull_request" }, { status: 400 });
  }

  const project = await matchProjectBySignature();

  if (!project) {
    const linked = await prisma.project.count({
      where: {
        githubRepo: { equals: repo, mode: "insensitive" },
        githubWebhookSecret: { not: null },
      },
    });
    if (linked > 0) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      matched: false,
      reason: `No project linked to ${repo}`,
    });
  }

  const isMergedClose =
    payload.action === "closed" && pr.merged === true && project.autoCloseOnPrMerge;

  if (!isMergedClose) {
    return NextResponse.json({
      ok: true,
      matched: true,
      processed: false,
      reason: "Not a merged PR close event (or auto-close disabled)",
    });
  }

  const text = `${pr.title}\n${pr.body ?? ""}`;
  // Prefer project-scoped keys, but also accept any KEY-N present and match in this project
  const scoped = extractIssueKeys(text, project.key);
  const anyKeys = extractIssueKeys(text);
  const keys = [...new Set([...scoped, ...anyKeys.filter((k) => k.startsWith(`${project.key}-`))])];

  if (keys.length === 0) {
    return NextResponse.json({
      ok: true,
      matched: true,
      processed: false,
      reason: `No ${project.key}-N keys found in PR title/body`,
      tip: `Include keys like ${project.key}-12 in the PR title or description`,
    });
  }

  const issues = await prisma.task.findMany({
    where: {
      projectId: project.id,
      issueKey: { in: keys },
    },
  });

  if (issues.length === 0) {
    return NextResponse.json({
      ok: true,
      matched: true,
      processed: false,
      reason: "Keys found but no matching issues in this project",
      keys,
    });
  }

  const closed: string[] = [];
  for (const issue of issues) {
    const previous = issue.status;
    await prisma.task.update({
      where: { id: issue.id },
      data: {
        status: "DONE",
        githubPrUrl: pr.html_url,
        githubPrNumber: pr.number,
      },
    });
    await prisma.activity.create({
      data: {
        taskId: issue.id,
        actorId: project.ownerId,
        action: "GITHUB_PR_MERGED",
        field: "status",
        fromValue: previous,
        toValue: "DONE",
        message: `GitHub PR #${pr.number} merged — marked done (${pr.html_url})`,
      },
    });
    closed.push(issue.issueKey);
  }

  return NextResponse.json({
    ok: true,
    matched: true,
    processed: true,
    closed,
    pr: pr.number,
    projectId: project.id,
  });
}
