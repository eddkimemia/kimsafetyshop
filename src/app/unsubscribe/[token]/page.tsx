"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, MailX, XCircle } from "lucide-react";

export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "done" | "already" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = decodeURIComponent(params?.token ?? "");
    if (!token) {
      setState("error");
      setError("This unsubscribe link is invalid.");
      return;
    }
    fetch("/api/newsletter/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((json) => {
        if (json.ok) setState(json.already ? "already" : "done");
        else {
          setState("error");
          setError(json.error ?? "Could not unsubscribe.");
        }
      })
      .catch(() => {
        setState("error");
        setError("Network error — please try again.");
      });
  }, [params]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        {state === "loading" ? (
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-safety-500" />
        ) : state === "done" || state === "already" ? (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              {state === "done" ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              ) : (
                <MailX className="h-7 w-7 text-emerald-600" />
              )}
            </span>
            <h1 className="mt-4 font-display text-xl font-extrabold text-navy-900">
              {state === "done" ? "You're unsubscribed" : "Already unsubscribed"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {state === "done"
                ? "You won't receive any more KimSafety safety briefings. If this was a mistake, subscribe again anytime."
                : "Your email is already removed from our briefing list."}
            </p>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-7 w-7 text-danger" />
            </span>
            <h1 className="mt-4 font-display text-xl font-extrabold text-navy-900">Unsubscribe failed</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{error}</p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-navy-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-navy-800"
        >
          Back to KimSafety
        </Link>
      </div>
    </div>
  );
}
