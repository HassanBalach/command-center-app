import { supabase } from "./supabase";

// fetch() that sends the signed-in user's token to our own API routes.
export async function authedFetch(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  return fetch(url, { ...init, headers });
}
