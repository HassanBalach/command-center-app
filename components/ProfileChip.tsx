"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settings";

export function Avatar({ url, name, size = 36 }: { url: string | null; name: string | null; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2 font-bold text-muted"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        (name?.trim()[0] ?? "?").toUpperCase()
      )}
    </span>
  );
}

export default function ProfileChip({ showName = false }: { showName?: boolean }) {
  const s = useSettings();
  return (
    <Link href="/settings" className="flex min-w-0 items-center gap-3" aria-label="Your profile">
      <Avatar url={s.avatar_url} name={s.display_name} size={showName ? 44 : 36} />
      {showName && (
        <span className="min-w-0">
          <span className="block truncate font-semibold">{s.display_name ?? "Your profile"}</span>
          <span className="block text-xs text-muted">View profile</span>
        </span>
      )}
    </Link>
  );
}
