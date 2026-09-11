"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem("projmanager-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
