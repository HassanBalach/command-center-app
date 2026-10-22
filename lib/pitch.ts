import type { Audit } from "./audit";
import { DEFAULT_SETTINGS, type Settings } from "./settings";

export function whatsappNumber(phone: string | null | undefined, countryCode: string): string | null {
  if (!phone) return null;
  const international = phone.trim().startsWith("+");
  let digits = phone.replace(/\D/g, "");
  if (!international) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.startsWith("0") && countryCode) digits = countryCode + digits.slice(1);
  }
  return digits.length >= 10 ? digits : null;
}

function problemText(hasWebsite: boolean, audit?: Audit | null): string {
  if (!hasWebsite) return "you don't have a website where customers can find and contact you";
  if (audit && !audit.reachable) return "your website isn't loading right now";
  if (audit && audit.issues.length)
    return `a few things on your website that may be costing you customers: ${audit.issues
      .slice(0, 3)
      .join(", ")
      .toLowerCase()}`;
  return "a few ways to bring you more customers online";
}

export function pitchMessage(
  name: string,
  hasWebsite: boolean,
  audit: Audit | null | undefined,
  settings: Settings,
): string {
  return settings.pitch_template
    .replaceAll("{name}", name)
    .replaceAll("{problem}", problemText(hasWebsite, audit))
    .replaceAll("{service}", settings.service);
}

export function whatsappLink(
  phone: string | null | undefined,
  name: string,
  hasWebsite: boolean,
  audit?: Audit | null,
  settings: Settings = DEFAULT_SETTINGS,
): string | null {
  const number = whatsappNumber(phone, settings.country_code);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(pitchMessage(name, hasWebsite, audit, settings))}`;
}
