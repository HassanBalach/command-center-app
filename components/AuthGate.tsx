"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Turn raw Supabase auth errors into something a person can act on.
function friendly(err: { message: string; code?: string; status?: number }): string {
  const m = err.message.toLowerCase();
  const c = err.code ?? "";
  if (c === "over_email_send_rate_limit" || m.includes("rate limit"))
    return "Too many emails were sent recently. Please wait about an hour and try again, or ask for your account to be created for you.";
  if (c === "invalid_credentials" || m.includes("invalid login"))
    return "Wrong email or password. If you don't have an account yet, tap “Create account”.";
  if (c === "email_not_confirmed" || m.includes("not confirmed"))
    return "Please confirm your email first. Check your inbox and spam folder for the link.";
  if (c === "user_already_exists" || m.includes("already registered"))
    return "This email already has an account. Sign in instead.";
  if (c === "weak_password" || m.includes("password should"))
    return "That password is too weak. Use at least 6 characters.";
  if (c === "signup_disabled") return "Sign-ups are turned off right now.";
  if (m.includes("fetch") || m.includes("network"))
    return "Can't reach the server. Check your internet connection and try again.";
  return "Something went wrong. Please try again in a moment.";
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setError("");
    setInfo("");
    const creds = { email: email.trim().toLowerCase(), password };
    if (!/^\S+@\S+\.\S+$/.test(creds.email)) return setError("Enter a valid email address.");
    if (!creds.password) return setError("Enter your password.");
    if (mode === "up" && creds.password.length < 6) return setError("Choose a password with at least 6 characters.");

    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword(creds);
        if (error) setError(friendly(error));
      } else {
        const { data, error } = await supabase.auth.signUp(creds);
        if (error) setError(friendly(error));
        else if (data.user && data.user.identities?.length === 0) {
          setMode("in");
          setError("This email already has an account. Sign in instead.");
        } else if (!data.session)
          setInfo("Almost done! Check your inbox (and spam) for the confirmation link, then sign in.");
      }
    } catch {
      setError("Can't reach the server. Check your internet connection and try again.");
    }
    setBusy(false);
  }

  function switchMode() {
    setMode(mode === "in" ? "up" : "in");
    setError("");
    setInfo("");
  }

  if (!ready) return null;
  if (session) return <>{children}</>;

  const input =
    "w-full rounded-xl border border-line bg-surface-2 px-4 py-3 outline-none focus:border-accent";

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm items-center px-4">
      <form onSubmit={submit} noValidate className="w-full space-y-4 rounded-3xl border border-line bg-surface p-6">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-muted">{mode === "in" ? "Sign in to continue." : "Create your account."}</p>
        </div>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={input}
        />
        <input
          type="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={input}
        />
        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="rounded-xl bg-accent/10 px-3 py-2.5 text-sm text-accent">
            {info}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-accent-ink disabled:opacity-50"
        >
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={switchMode} className="w-full rounded-xl py-2 text-sm text-muted">
          {mode === "in" ? "New here? Create account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
