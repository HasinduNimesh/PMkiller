import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProjManager — Company projects with CPM & RBAC",
  description:
    "Track deadlines, severity-based work, critical path schedules, and GitHub PR automation — daisyUI themes included.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="corporate"
      className={`${sans.variable} ${display.variable} h-full`}
    >
      <body className="app-canvas min-h-full font-sans text-base-content antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
