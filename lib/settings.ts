"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Settings = {
  service: string;
  pitch_template: string;
  country_code: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location_label: string | null;
  lat: number | null;
  lng: number | null;
};

export const DEFAULT_SETTINGS: Settings = {
  service: "build websites that bring in more customers",
  pitch_template:
    "Hi {name} team, I noticed {problem}. I {service} and can show you how I would fix it. Would you like a quick look?",
  country_code: "92",
  display_name: null,
  bio: null,
  avatar_url: null,
  location_label: null,
  lat: null,
  lng: null,
};

export const SETTINGS_COLUMNS =
  "service, pitch_template, country_code, display_name, bio, avatar_url, location_label, lat, lng";

export const SETTINGS_CHANGED = "settings-changed";

export function useSettings(): Settings {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const load = () =>
      supabase
        .from("settings")
        .select(SETTINGS_COLUMNS)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setSettings(data as Settings);
        });
    load();
    window.addEventListener(SETTINGS_CHANGED, load);
    return () => window.removeEventListener(SETTINGS_CHANGED, load);
  }, []);

  return settings;
}
