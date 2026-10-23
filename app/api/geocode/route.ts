import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { geocode } from "@/lib/places";

export async function GET(request: Request) {
  const denied = await requireUser(request, "leads");
  if (denied) return denied;

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });
  try {
    const place = await geocode(q);
    if (!place) return NextResponse.json({ error: "Address not found" }, { status: 404 });
    return NextResponse.json(place);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
