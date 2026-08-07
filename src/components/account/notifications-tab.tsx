"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: number;
  created_at: string;
};

const TYPE_ICON: Record<string, string> = {
  order: "bg-safety-50 text-safety-600",
  quote: "bg-navy-900/5 text-navy-900",
  support: "bg-emerald-50 text-emerald-700",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read", id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: 1 } : n)));
  };

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "readAll" }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  const unread = notifications.filter((n) => n.read === 0).length;

  return (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy-900">Notifications</h2>
          <p className="text-xs text-gray-400">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-bold text-navy-900 transition-colors hover:bg-surface"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className="py-8 text-center">
          <BellOff className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">
            No notifications yet. Order updates and quote responses will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                n.read === 0 ? "border-safety-200 bg-safety-50/50" : "border-line hover:bg-surface"
              )}
            >
              <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TYPE_ICON[n.type] ?? "bg-surface text-gray-500")}>
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", n.read === 0 ? "font-bold text-navy-900" : "font-semibold text-gray-600")}>
                  {n.title}
                </p>
                {n.message && <p className="mt-0.5 text-xs text-gray-500">{n.message}</p>}
                <p className="mt-1 text-[11px] text-gray-400">{relativeTime(n.created_at)}</p>
              </div>
              {n.link && (
                <Link
                  href={n.link}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded-lg bg-navy-900 px-3.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-navy-800"
                >
                  View →
                </Link>
              )}
              {n.read === 0 && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-safety-500" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
