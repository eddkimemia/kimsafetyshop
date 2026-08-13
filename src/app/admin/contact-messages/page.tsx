"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { useFetch, AdminCard } from "@/components/admin/ui";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  created_at: string;
};

export default function AdminContactMessagesPage() {
  const { data, loading, refresh } = useFetch<{ messages: Message[] }>("/api/admin/contact-messages");
  const [notice, setNotice] = useState<string | null>(null);

  const remove = async (id: string) => {
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/contact-messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete message");
      setNotice(`Message ${id} deleted.`);
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to delete message");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-900">
          <Inbox className="h-6 w-6 text-safety-500" /> Contact messages
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Submissions from the contact page — staff are alerted by email the moment one arrives.
        </p>
      </div>

      {notice && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>
      )}

      <AdminCard title={`${data?.messages?.length ?? 0} message${(data?.messages?.length ?? 0) === 1 ? "" : "s"}`}>
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">Loading messages…</p>
        ) : (data?.messages ?? []).length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {(data?.messages ?? []).map((m) => (
              <div key={m.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-navy-900">
                      {m.name} <span className="font-normal text-gray-400">· {m.email}{m.phone ? ` · ${m.phone}` : ""}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {m.id} · {m.topic} · {new Date(m.created_at).toLocaleString("en-KE")}
                    </p>
                  </div>
                  <a
                    href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic)}`}
                    className="rounded-lg bg-safety-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-safety-600"
                  >
                    Reply by email
                  </a>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-surface px-4 py-3 text-sm text-navy-900">{m.message}</p>
                <div className="mt-2 text-right">
                  <button
                    onClick={() => remove(m.id)}
                    className="text-[11px] font-bold text-gray-400 transition-colors hover:text-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}