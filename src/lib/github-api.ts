import { generateWebhookSecret } from "@/lib/github";

const GITHUB_API = "https://api.github.com";

export type GithubRepoItem = {
  id: number;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  permissions?: { admin?: boolean; push?: boolean };
};

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ProjManager",
  };
}

export function isGithubOAuthConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export function getGithubOAuthAuthorizeUrl(state: string) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error("GITHUB_CLIENT_ID missing");
  const base = (process.env.AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const redirectUri = `${base}/api/github/oauth/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo admin:repo_hook read:user",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGithubCode(code: string) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GitHub OAuth not configured");

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  if (!res.ok) throw new Error("Failed to exchange GitHub code");
  const data = (await res.json()) as {
    access_token?: string;
    token_type?: string;
    scope?: string;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(data.error_description || data.error || "No access token from GitHub");
  }
  return data;
}

export async function fetchGithubUser(token: string) {
  const res = await fetch(`${GITHUB_API}/user`, { headers: githubHeaders(token) });
  if (!res.ok) throw new Error("Failed to load GitHub user");
  return (await res.json()) as { id: number; login: string };
}

export async function listGithubRepos(token: string): Promise<GithubRepoItem[]> {
  const repos: GithubRepoItem[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
      { headers: githubHeaders(token) },
    );
    if (!res.ok) throw new Error("Failed to list GitHub repositories");
    const batch = (await res.json()) as GithubRepoItem[];
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos.filter((r) => r.permissions?.admin);
}

export async function createRepoWebhook(input: {
  token: string;
  owner: string;
  repo: string;
  webhookUrl: string;
  secret: string;
}) {
  const res = await fetch(`${GITHUB_API}/repos/${input.owner}/${input.repo}/hooks`, {
    method: "POST",
    headers: {
      ...githubHeaders(input.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["pull_request"],
      config: {
        url: input.webhookUrl,
        content_type: "json",
        secret: input.secret,
        insecure_ssl: "0",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub webhook create failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { id: number };
  return data.id;
}

export async function deleteRepoWebhook(input: {
  token: string;
  owner: string;
  repo: string;
  hookId: number;
}) {
  const res = await fetch(
    `${GITHUB_API}/repos/${input.owner}/${input.repo}/hooks/${input.hookId}`,
    {
      method: "DELETE",
      headers: githubHeaders(input.token),
    },
  );
  // 404 = already gone
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`GitHub webhook delete failed (${res.status}): ${text}`);
  }
}

export function newWebhookSecret() {
  return generateWebhookSecret();
}
