"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFetch } from "@/components/admin/ui";
import { BannerEditor, type Banner } from "@/components/admin/marketing/banner-editor";

export default function EditBannerPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const { data, loading } = useFetch<{ banners: Banner[] }>("/api/admin/marketing/banners");

  const found = useMemo(
    () => (data?.banners ?? []).find((b) => b.id === id),
    [data, id]
  );

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-400">Loading banner…</p>;
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
          Banner #{Number.isInteger(id) ? id : "?"} not found.
        </p>
      </div>
    );
  }
  return <BannerEditor initial={found} isNew={false} />;
}
