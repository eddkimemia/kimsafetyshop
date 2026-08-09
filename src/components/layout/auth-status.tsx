"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { User, LogOut, ShieldCheck } from "lucide-react";

export function AuthStatus() {
  const [session, setSession] = useState<{ user?: { name?: string | null; email?: string | null; role?: string } } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!alive) return;
        setSession(await res.json());
      } catch {
        // Transient network/lambda failures: retry shortly so the account
        // button catches up instead of staying stuck on "Hello, sign in".
        if (!alive) return;
        setTimeout(load, 3000);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const user = session?.user ?? null;

  return (
    <>
      {/* Mobile (< md): compact profile / sign-in button in the navbar */}
      {user ? (
        <Link
          href="/account"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-surface md:hidden"
          aria-label="My account"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-safety-500 text-xs font-bold text-white">
            {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
          </span>
        </Link>
      ) : (
        <Link
          href="/login"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy-900 transition-colors hover:bg-surface md:hidden"
          aria-label="Sign in to your account"
        >
          <User className="h-5 w-5" />
        </Link>
      )}

      {/* Desktop (md+): sign-in link / account dropdown */}
      {user ? (
        <div className="group relative hidden md:block">
          <button className="flex h-11 items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-surface">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-safety-500 text-[10px] font-bold text-white">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </span>
            <span className="hidden flex-col xl:flex">
              <span className="max-w-[120px] truncate text-[10px] font-medium text-gray-400">
                {user.name ?? user.email}
              </span>
              <span className="text-xs font-bold text-navy-900">My Account</span>
            </span>
          </button>
          <div className="invisible absolute right-0 top-full z-50 w-56 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <div className="border-b border-line bg-surface px-4 py-3">
                <p className="truncate text-xs font-bold text-navy-900">{user.name ?? "Account"}</p>
                <p className="truncate text-[11px] text-gray-400">{user.email}</p>
              </div>
              <div className="p-1.5">
                <Link href="/account" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-surface">
                  <User className="h-4 w-4 text-gray-400" /> My Account
                </Link>
                {(user.role === "admin" || user.role === "superadmin") && (
                  <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-surface">
                    <ShieldCheck className="h-4 w-4 text-safety-500" /> Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-danger hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          href="/login"
          className="hidden h-11 items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-surface md:flex"
          aria-label="Sign in to your account"
        >
          <User className="h-5 w-5 text-navy-900" />
          <span className="hidden flex-col xl:flex">
            <span className="text-[10px] font-medium text-gray-400">Hello, sign in</span>
            <span className="text-xs font-bold text-navy-900">Account</span>
          </span>
        </Link>
      )}
    </>
  );
}
