/** Shared MCP client config snippets for Integrations UI. */

export function mcpCursorJson(baseUrl: string, apiKey: string) {
  return JSON.stringify(
    {
      mcpServers: {
        projmanager: {
          command: "pnpm",
          args: ["exec", "tsx", "mcp/server.ts"],
          cwd: "<path-to-Proj-Manager-repo>",
          env: {
            PROJMANAGER_URL: baseUrl,
            MCP_API_KEY: apiKey,
          },
        },
      },
    },
    null,
    2,
  );
}

export function mcpClaudeDesktopJson(baseUrl: string, apiKey: string) {
  return JSON.stringify(
    {
      mcpServers: {
        projmanager: {
          command: "pnpm",
          args: ["exec", "tsx", "mcp/server.ts"],
          env: {
            PROJMANAGER_URL: baseUrl,
            MCP_API_KEY: apiKey,
          },
        },
      },
    },
    null,
    2,
  );
}

export function mcpClaudeCodeJson(baseUrl: string, apiKey: string) {
  return JSON.stringify(
    {
      mcpServers: {
        projmanager: {
          type: "stdio",
          command: "pnpm",
          args: ["exec", "tsx", "mcp/server.ts"],
          cwd: "<path-to-Proj-Manager-repo>",
          env: {
            PROJMANAGER_URL: baseUrl,
            MCP_API_KEY: apiKey,
          },
        },
      },
    },
    null,
    2,
  );
}

export function mcpClaudeCodeCli(baseUrl: string, apiKey: string) {
  return [
    `cd <path-to-Proj-Manager-repo>`,
    `claude mcp add --scope user projmanager -- env \\`,
    `  PROJMANAGER_URL=${baseUrl} \\`,
    `  MCP_API_KEY=${apiKey} \\`,
    `  pnpm exec tsx mcp/server.ts`,
  ].join("\n");
}

export function mcpEnvBlock(baseUrl: string, apiKey: string) {
  return [`PROJMANAGER_URL=${baseUrl}`, `MCP_API_KEY=${apiKey}`].join("\n");
}

export const MCP_PLACEHOLDER_TOKEN = "<paste-your-personal-pmk_token>";
