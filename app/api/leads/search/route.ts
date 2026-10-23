import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { searchPlaces } from "@/lib/places";

export async function GET(request: Request) {
  const denied = await requireUser(request, "leads");
  if (denied) return denied;

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const radiusKm = Number(params.get("radius") ?? 5);
  const bias =
    params.has("lat") && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng, radiusM: radiusKm * 1000 }
      : undefined;

  try {
    return NextResponse.json({ leads: await searchPlaces(q, bias) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
