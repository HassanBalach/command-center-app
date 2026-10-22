"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGate from "./AuthGate";
import { CreatorIcon, HomeIcon, PipelineIcon, SearchIcon, SettingsIcon, WalletIcon } from "./icons";
import LogoutButton from "./LogoutButton";
import ProfileChip from "./ProfileChip";
import ThemeToggle from "./ThemeToggle";

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/leads", label: "Leads", Icon: SearchIcon },
  { href: "/pipeline", label: "Pipeline", Icon: PipelineIcon },
  { href: "/money", label: "Money", Icon: WalletIcon },
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
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-semibold ${
                active(href) ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
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
            <p className="truncate font-extrabold">Command Center</p>
          </div>
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-2xl px-5 pt-5 pb-32 md:pb-10">{children}</main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-4 z-10 rounded-full border border-line bg-surface/95 shadow-lg backdrop-blur md:hidden"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <ul className="flex items-center justify-between p-2">
          {tabs.map(({ href, label, Icon }) => {
            const on = active(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={on ? "page" : undefined}
                  className={
                    on
                      ? "flex h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-extrabold text-accent-ink"
                      : "flex h-11 w-11 items-center justify-center text-muted"
                  }
                >
                  <Icon />
                  {on && label}
                </Link>
              </li>
            );
          })}
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
