"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { authedFetch } from "@/lib/api";
import { DEFAULT_SETTINGS, SETTINGS_CHANGED, SETTINGS_COLUMNS, type Settings } from "@/lib/settings";
import { pitchMessage } from "@/lib/pitch";
import AvatarCropper from "./AvatarCropper";
import LogoutButton from "./LogoutButton";

const input = "w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-accent";
const card = "space-y-4 rounded-2xl border border-line bg-surface-2/40 p-4";

export default function SettingsForm() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState("");
  const [addr, setAddr] = useState("");
  const [locMsg, setLocMsg] = useState("");
  const [photoMsg, setPhotoMsg] = useState("");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase
      .from("settings")
      .select(SETTINGS_COLUMNS)
      .maybeSingle()
      .then(({ data }) => data && setS(data as Settings));
  }, []);

  async function save(next: Settings = s) {
    setStatus("Saving…");
    const { error } = await supabase
      .from("settings")
      .upsert({ ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setStatus(error ? error.message : "Saved ✓");
    if (!error) window.dispatchEvent(new Event(SETTINGS_CHANGED));
  }

  async function uploadAvatar(blob: Blob) {
    setCropFile(null);
    setPhotoMsg("Uploading…");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setPhotoMsg("Sign in first");

    // New file name every time: needs only the insert permission, and dodges stale caches.
    const path = `${u.user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
    if (error) return setPhotoMsg(`Upload failed: ${error.message}`);

    const oldPath = s.avatar_url?.split("/avatars/")[1]?.split("?")[0];
    if (oldPath) await supabase.storage.from("avatars").remove([oldPath]);

    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const next = { ...s, avatar_url: url };
    setS(next);
    const { error: saveError } = await supabase
      .from("settings")
      .upsert({ ...next, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    setPhotoMsg(saveError ? `Saved photo but not profile: ${saveError.message}` : "Photo saved ✓");
    if (!saveError) window.dispatchEvent(new Event(SETTINGS_CHANGED));
  }

  async function findAddress() {
    if (!addr.trim()) return;
    setLocMsg("Searching…");
    const res = await authedFetch(`/api/geocode?q=${encodeURIComponent(addr)}`);
    const body = await res.json();
    if (!res.ok) return setLocMsg(body.error ?? "Not found");
    const next = { ...s, location_label: body.label, lat: body.lat, lng: body.lng };
    setS(next);
    setLocMsg("");
    await save(next);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setLocMsg("Location isn't available on this device");
    setLocMsg("Getting your location…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = {
          ...s,
          location_label: "My current location",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setS(next);
        setLocMsg("");
        await save(next);
      },
      () => setLocMsg("Location permission was denied"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  async function clearLocation() {
    const next = { ...s, location_label: null, lat: null, lng: null };
    setS(next);
    await save(next);
  }

  const preview = pitchMessage("Acme Dental", false, null, s);
  const initial = (s.display_name?.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6">
      {cropFile && (
        <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onDone={uploadAvatar} />
      )}
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className={card}>
        <h2 className="font-semibold">Profile</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-2xl font-bold text-muted"
            aria-label="Change profile photo"
          >
            {s.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </button>
          <div>
            <button onClick={() => fileRef.current?.click()} className="text-sm text-accent underline">
              {s.avatar_url ? "Change photo" : "Add photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCropFile(f);
                e.target.value = "";
              }}
            />
            {photoMsg && <p className="mt-1 text-sm text-muted">{photoMsg}</p>}
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-sm text-muted">Name</span>
          <input
            className={input}
            value={s.display_name ?? ""}
            onChange={(e) => setS({ ...s, display_name: e.target.value })}
            placeholder="Your name"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Bio</span>
          <textarea
            rows={3}
            className={input}
            value={s.bio ?? ""}
            maxLength={240}
            onChange={(e) => setS({ ...s, bio: e.target.value })}
            placeholder="What you do, in a sentence or two"
          />
        </label>
      </section>

      <section className={card}>
        <h2 className="font-semibold">My location</h2>
        <p className="text-sm text-muted">Used by “Near me” when you search for leads.</p>
        {s.lat !== null && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-accent/10 px-3 py-2 text-sm">
            <span className="min-w-0 truncate">📍 {s.location_label}</span>
            <button onClick={clearLocation} className="shrink-0 text-muted underline">
              Clear
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            className={input}
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && findAddress()}
            placeholder="Your address or city"
          />
          <button onClick={findAddress} className="rounded-xl bg-accent px-4 font-semibold text-accent-ink">
            Set
          </button>
        </div>
        <button onClick={useMyLocation} className="text-sm text-accent underline">
          Use my current location
        </button>
        {locMsg && <p className="text-sm text-muted">{locMsg}</p>}
      </section>

      <section className={card}>
        <h2 className="font-semibold">Pitch</h2>
        <label className="block space-y-1">
          <span className="text-sm text-muted">What do you offer? (after “I …”)</span>
          <input className={input} value={s.service} onChange={(e) => setS({ ...s, service: e.target.value })} />
          <span className="text-xs text-muted">e.g. build websites, edit videos for brands, run Google Ads</span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Message template</span>
          <textarea
            rows={5}
            className={input}
            value={s.pitch_template}
            onChange={(e) => setS({ ...s, pitch_template: e.target.value })}
          />
          <span className="text-xs text-muted">
            Use {"{name}"}, {"{problem}"} and {"{service}"}.
          </span>
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Default country code (for local numbers)</span>
          <input
            className={input}
            inputMode="numeric"
            value={s.country_code}
            onChange={(e) => setS({ ...s, country_code: e.target.value.replace(/\D/g, "") })}
          />
        </label>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="mb-1 text-xs uppercase tracking-wide text-muted">Preview</p>
          <p className="text-sm">{preview}</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={() => save()} className="rounded-xl bg-accent px-6 py-3 font-semibold text-accent-ink">
          Save
        </button>
        <span className="text-sm text-muted">{status}</span>
      </div>

      <div className="border-t border-line pt-5">
        <LogoutButton className="w-full" />
      </div>
    </div>
  );
}
