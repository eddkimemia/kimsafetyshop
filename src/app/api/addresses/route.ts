import { NextResponse } from "next/server";
import { createAddress, listAddressesForUser } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  return NextResponse.json({ addresses: await listAddressesForUser(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: { label?: string; name?: string; phone?: string; address_line?: string; city?: string; county?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.name || !body.address_line) {
    return NextResponse.json({ error: "Name and address are required" }, { status: 400 });
  }
  const address = createAddress({
    user_id: user.id,
    label: body.label ?? "Home",
    name: body.name,
    phone: body.phone ?? "",
    address_line: body.address_line,
    city: body.city ?? "",
    county: body.county ?? "",
  });
  return NextResponse.json({ address }, { status: 201 });
}
