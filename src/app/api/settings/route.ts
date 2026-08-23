import { NextResponse } from "next/server";
import { getAllSettings, getSettingsVersion } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const [settings, version] = await Promise.all([getAllSettings(), getSettingsVersion()]);
  return NextResponse.json(
    { settings, version },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
