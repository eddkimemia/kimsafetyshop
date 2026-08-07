"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFetch } from "@/components/admin/ui";
import { CampaignEditor, type Campaign } from "@/components/admin/marketing/campaign-editor";

export default function EditCampaignPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { data, loading } = useFetch<{ campaigns: Campaign[] }>("/api/admin/marketing/campaigns");

  const found = useMemo(
    () => (data?.campaigns ?? []).find((c) => c.id === id),
    [data, id]
  );

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-400">Loading campaign…</p>;
  }
  if (!found) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/marketing"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
          aria-label="Back to Marketing"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
          Campaign #{Number.isInteger(id) ? id : "?"} not found.
        </p>
      </div>
    );
  }
  return <CampaignEditor initial={found} isNew={false} />;
}
