"use client";

import { Capacitor } from "@capacitor/core";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

// Opens in the in-app browser on Android, in a new tab on the web.
export default function ExtLink({ href, onClick, children, ...rest }: Props) {
  async function handle(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (Capacitor.isNativePlatform()) {
      e.preventDefault();
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url: href });
    }
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={handle} {...rest}>
      {children}
    </a>
  );
}
