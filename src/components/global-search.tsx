"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Hit = {
  id: string;
  issueKey: string;
  title: string;
  status: string;
  issueType: string;
  project: { id: string; name: string; key: string };
};

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);
  const [modKey, setModKey] = useState("Ctrl");
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    setModKey(isApple ? "⌘" : "Ctrl");
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (q.trim().length < 1) {
      setHits([]);
      setSearched(false);
      return;
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) return;
        const data = (await res.json()) as { results: Hit[] };
        setHits(data.results);
        setActive(0);
        setSearched(true);
        setOpen(true);
      });
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  function go(hit: Hit) {
    setOpen(false);
    setQ("");
    router.push(`/projects/${hit.project.id}/issues/${hit.id}`);
  }

  return (
    <div ref={boxRef} className={`relative w-full ${compact ? "max-w-none" : "max-w-md"}`}>
      <label className="input input-sm flex items-center gap-2 rounded-xl border-base-300/60 bg-base-200/70">
        <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => (hits.length > 0 || searched) && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && hits[active]) {
              e.preventDefault();
              go(hits[active]);
            }
          }}
          placeholder="Jump to WEB-12…"
          className="grow bg-transparent"
          aria-label="Search issues"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {pending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <kbd className="kbd kbd-xs hidden opacity-50 sm:inline-flex">{modKey}+K</kbd>
        )}
      </label>
      {open && q.trim().length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-80 w-full overflow-auto rounded-2xl border border-base-300/60 bg-base-100 p-1.5 shadow-xl">
          {hits.length === 0 && searched && !pending && (
            <li className="px-3 py-4 text-center text-sm opacity-50">
              No issues match “{q.trim()}”
            </li>
          )}
          {hits.map((hit, idx) => (
            <li key={hit.id}>
              <button
                type="button"
                className={`flex w-full flex-col items-start rounded-xl px-3 py-2 text-left ${
                  idx === active ? "bg-base-200" : "hover:bg-base-200/70"
                }`}
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(hit)}
              >
                <span className="font-mono text-xs opacity-60">{hit.issueKey}</span>
                <span className="text-sm font-semibold">{hit.title}</span>
                <span className="text-[11px] opacity-50">
                  {hit.project.name} · {hit.issueType} · {hit.status.replaceAll("_", " ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
