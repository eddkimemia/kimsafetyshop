"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";

const field =
  "w-full rounded-xl border border-line bg-white px-3.5 py-3 pl-11 text-sm outline-none transition-all focus:border-safety-400 focus:ring-4 focus:ring-safety-500/10";

/** Change-password form — verifies the current password via /api/account/password. */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not update the password");
      setCurrent("");
      setNext("");
      setConfirm("");
      setNotice("Password updated. Use your new password the next time you sign in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {notice && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </p>
      )}
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-danger">{error}</p>}

      <form onSubmit={submit} className="max-w-md space-y-4">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={show ? "text" : "password"}
            required
            placeholder="Current password"
            className={field}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={show ? "text" : "password"}
            required
            minLength={6}
            placeholder="New password"
            className={field}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type={show ? "text" : "password"}
            required
            minLength={6}
            placeholder="Confirm new password"
            className={field}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-safety-500 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {loading ? "Updating…" : "Update password"}
          </button>
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-navy-900"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {show ? "Hide passwords" : "Show passwords"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400">
          Forgot your password?{" "}
          <a href="/forgot-password" className="font-bold text-safety-600 hover:underline">
            Request a reset link
          </a>{" "}
          instead.
        </p>
      </form>
    </>
  );
}
