export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/**
 * QueueTimeOutURL for Daraja's Transaction Status API — ACK only, nothing to
 * reconcile when a lookup times out (the callback/result paths still run).
 */
export async function POST() {
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
}
