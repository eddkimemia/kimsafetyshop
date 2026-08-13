import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin, getSessionUser } from "@/lib/api-helpers";
import { createUser, deleteUser, listUsers, setUserRole, setUserVerified, getUserById, getUserByEmail, updateUserProfile } from "@/lib/db";

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
      referral_code: u.referral_code,
      referred_by: u.referred_by,
      created_at: u.created_at,
    }));
  // Resolve the referrer's name for every user that was referred.
  const byId = new Map(all.map((u) => [u.id, u.name]));
  const usersWithReferrer = users.map((u) => ({
    ...u,
    referred_by_name: u.referred_by ? (byId.get(u.referred_by) ?? null) : null,
  }));
  return NextResponse.json({ users: usersWithReferrer });
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

  let body: { id?: string; role?: string; verified?: boolean; name?: string; email?: string; phone?: string | null; company?: string | null };
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

  // Editing profile fields. Staff accounts are superadmin-only; regular
  // customers may be edited by any staff member.
  if (body.name !== undefined || body.email !== undefined || body.phone !== undefined || body.company !== undefined) {
    const me = await getSessionUser();
    const isStaffTarget = target.role !== "user";
    if (isStaffTarget && me?.role !== "superadmin") {
      return NextResponse.json({ error: "Only the superadmin can edit staff accounts" }, { status: 403 });
    }
    const email = body.email?.trim().toLowerCase();
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (email && email !== target.email) {
      const other = await getUserByEmail(email);
      if (other && other.id !== target.id) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
    }
    const name = body.name?.trim();
    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    await updateUserProfile(target.id, {
      name: name ?? undefined,
      email: email ?? undefined,
      phone: body.phone === undefined ? undefined : body.phone?.trim() || null,
      company: body.company === undefined ? undefined : body.company?.trim() || null,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const me = await getSessionUser();
  if (target.id === me?.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
