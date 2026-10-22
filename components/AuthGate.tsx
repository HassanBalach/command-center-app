"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(mode: "in" | "up") {
    setError("");
    setInfo("");
    setBusy(true);
    const creds = { email, password };
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp(creds);
      if (error) setError(error.message);
      else if (!data.session)
        setInfo("Check your email and click the confirmation link, then come back and sign in.");
    }
    setBusy(false);
  }

  if (!ready) return null;
  if (session) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm items-center px-4">
    <div className="w-full space-y-4 rounded-3xl border border-line bg-surface p-6">
      <div>
        <h1 className="text-2xl font-bold">Command Center</h1>
        <p className="text-muted">Sign in to continue.</p>
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {info && <p className="text-sm text-accent">{info}</p>}
      <button
        disabled={busy}
        onClick={() => submit("in")}
        className="w-full rounded-xl bg-accent py-3 font-semibold text-accent-ink disabled:opacity-50"
      >
        Sign in
      </button>
      <button
        disabled={busy}
        onClick={() => submit("up")}
        className="w-full rounded-xl py-2 text-sm text-muted disabled:opacity-50"
      >
        New here? Create account
      </button>
    </div>
    </div>
  );
}
