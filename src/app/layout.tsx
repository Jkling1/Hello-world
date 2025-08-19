import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { ProfileBadge } from "@/components/ui/ProfileBadge";
import { DevToggle } from "@/components/DevToggle";

export const metadata = {
  title: "Project IronMind",
  description: "Neon Life OS + Game Engine",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/5 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg md:text-xl font-semibold text-neon-cyan">
              Project IronMind
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm text-white/80">
              <Link className="hover:text-white" href="/">Dashboard</Link>
              <Link className="hover:text-white" href="/training">Training</Link>
              <Link className="hover:text-white" href="/nutrition">Nutrition</Link>
              <Link className="hover:text-white" href="/metrics">Metrics</Link>
              <Link className="hover:text-white" href="/budget">Budget</Link>
              <Link className="hover:text-white" href="/coach">Coach</Link>
            </nav>
            <div className="flex items-center gap-3">
              <DevToggle />
              <ProfileBadge name="Jordan" />
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-4 md:py-6">{children}</main>
      </body>
    </html>
  );
}

