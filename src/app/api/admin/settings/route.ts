import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-helpers";
import { getAllSettings, setSetting } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;
  return NextResponse.json({ settings: getAllSettings() });
}

export async function PUT(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const allowed = new Set(Object.keys(DEFAULT_SETTINGS));
  const entries = Object.entries(body).filter(([k]) => allowed.has(k));
  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
  }

  for (const [key, value] of entries) {
    setSetting(key, typeof value === "string" ? value : String(value ?? ""));
  }

  return NextResponse.json({ settings: getAllSettings() });
}