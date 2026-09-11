"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyIssueKey({ issueKey }: { issueKey: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost btn-xs gap-1"
      title="Copy issue key"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(issueKey);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard may be blocked in insecure contexts */
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
