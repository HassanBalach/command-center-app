"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGate from "./AuthGate";
import LogoutButton from "./LogoutButton";
import ProfileChip from "./ProfileChip";
import ThemeToggle from "./ThemeToggle";
import { CreatorIcon, HomeIcon, PipelineIcon, SearchIcon, SettingsIcon } from "./icons";

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/leads", label: "Leads", Icon: SearchIcon },
  { href: "/pipeline", label: "Pipeline", Icon: PipelineIcon },
  { href: "/creator", label: "Creator", Icon: CreatorIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div className="min-h-dvh md:flex">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 self-start border-r border-line p-4 md:block">
        <div className="mb-6 px-3">
          <ProfileChip showName />
        </div>
        <nav className="space-y-1">
          {tabs.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                active(href) ? "bg-surface-2 text-accent" : "text-muted hover:text-ink"
              }`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 flex items-center gap-2 px-3">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <ProfileChip />
            <p className="truncate font-bold">Command Center</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-2xl px-4 pt-5 pb-28 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/90 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                  active(href) ? "text-accent" : "text-muted"
                }`}
              >
                <Icon />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <Shell>{children}</Shell>
    </AuthGate>
  );
}
