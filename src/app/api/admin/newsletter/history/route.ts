import { NextResponse } from "next/server";
import { listNewsletterCampaigns } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;
  return NextResponse.json({ campaigns: await listNewsletterCampaigns() });
}
