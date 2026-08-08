import { NextResponse } from "next/server";
import { getAllSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ settings: await getAllSettings() });
}