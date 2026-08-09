import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin, getSessionUser } from "@/lib/api-helpers";
import { createUser, listUsers, setUserRole, setUserVerified, getUserById, getUserByEmail } from "@/lib/db";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const me = await getSessionUser();
  // Staff (non-superadmin) can only see customers, never other staff accounts.
  const isSuper = me?.role === "superadmin";
  const all = await listUsers();
  const users = all
    .filter((u) => isSuper || u.role === "user")
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      company: u.company,
      phone: u.phone,
      verified: u.verified,
      created_at: u.created_at,
    }));
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  let body: { name?: string; email?: string; password?: string; phone?: string; company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid name and email address" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await createUser({
    name,
    email,
    password,
    role: "admin",
    company: body.company?.trim() || undefined,
    phone: body.phone?.trim() || undefined,
    verified: 1,
  });

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
    { status: 201 }
  );
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { id?: string; role?: string; verified?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const target = body.id ? await getUserById(body.id) : undefined;
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (body.role !== undefined) {
    if (body.role !== "user" && body.role !== "admin" && body.role !== "superadmin") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const deniedSuper = await requireSuperAdmin();
    if (deniedSuper) return deniedSuper;
    const me = await getSessionUser();
    if (target.id === me?.id) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
    }
    await setUserRole(target.id, body.role);
  }

  if (body.verified !== undefined) {
    await setUserVerified(target.id, body.verified ? 1 : 0);
  }

  return NextResponse.json({ ok: true });
}
