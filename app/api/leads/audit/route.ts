import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import { auditSite } from "@/lib/audit";

export async function GET(request: Request) {
  const denied = await requireUser(request, "leads");
  if (denied) return denied;

  const url = new URL(request.url).searchParams.get("url")?.trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: "Valid url required" }, { status: 400 });
  }
  return NextResponse.json(await auditSite(url));
}
