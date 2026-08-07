import { NextResponse } from "next/server";
import { deleteAddress, getAddress, setDefaultAddress } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const address = getAddress(params.id);
  if (!address || address.user_id !== user.id) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  deleteAddress(params.id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const address = getAddress(params.id);
  if (!address || address.user_id !== user.id) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  setDefaultAddress(params.id);
  return NextResponse.json({ ok: true });
}
