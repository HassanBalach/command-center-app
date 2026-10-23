import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Every API route calls this first: only signed-in users may spend your Google quota.
export async function requireUser(request: Request, feature?: "leads"): Promise<NextResponse | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  if (feature) {
    const scoped = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const { data: access } = await scoped.from("access").select("leads").maybeSingle();
    if (!access?.[feature]) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  return null;
}
