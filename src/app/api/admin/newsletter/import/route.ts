import { NextResponse } from "next/server";
import { importUsersToNewsletter } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** Adds every registered customer (users table) to the subscriber list. */
export async function POST() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;
  try {
    const { added, skipped } = await importUsersToNewsletter();
    return NextResponse.json({ ok: true, added, skipped });
  } catch (err) {
    console.error("[newsletter] import failed:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
