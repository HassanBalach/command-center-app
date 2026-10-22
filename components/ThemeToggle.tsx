"use client";

import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const isDark =
      root.dataset.theme === "dark" ||
      (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = isDark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted ${className}`}
    >
      <span className="theme-sun"><SunIcon /></span>
      <span className="theme-moon"><MoonIcon /></span>
    </button>
  );
}
