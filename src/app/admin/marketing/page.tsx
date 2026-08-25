"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ImagePlus,
  Megaphone,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { AdminCard, useFetch } from "@/components/admin/ui";
import type { Banner } from "@/components/admin/marketing/banner-editor";
import type { Campaign } from "@/components/admin/marketing/campaign-editor";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso: string | null): string {
  if (!iso) return "Open-ended";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1] ?? ""} ${y}`;
}

type FeaturedItem = { name: string; caption: string; image: string; category: string; sort: number };
type CategoryOption = { slug: string; name: string };

export default function AdminMarketingPage() {
  const router = useRouter();
  const banners = useFetch<{ banners: Banner[] }>("/api/admin/marketing/banners");
  const campaigns = useFetch<{ campaigns: Campaign[] }>("/api/admin/marketing/campaigns");
  const featured = useFetch<{ items: FeaturedItem[]; categories: CategoryOption[] }>("/api/admin/marketing/featured-categories");
  const [me, setMe] = useState<{ id: string; role?: string } | null>(null);
  const [addCat, setAddCat] = useState("");

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((s) => s?.user && setMe(s.user));
  }, []);

  const isSuper = me?.role === "superadmin";

  const toggleBanner = async (b: Banner) => {
    await fetch("/api/admin/marketing/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, active: !b.active }),
    });
    banners.refresh();
  };

  const toggleCampaign = async (c: Campaign) => {
    await fetch("/api/admin/marketing/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, active: !c.active }),
    });
    campaigns.refresh();
  };

  const moveBanner = async (index: number, dir: -1 | 1) => {
    const list = banners.data?.banners ?? [];
    const to = index + dir;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    [next[index], next[to]] = [next[to], next[index]];
    for (let i = 0; i < next.length; i++) {
      if (next[i].sort !== i) {
        await fetch("/api/admin/marketing/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...next[i], sort: i }),
        });
      }
    }
    banners.refresh();
  };

  const deleteBanner = async (id: number) => {
    if (!confirm("Delete this banner slide?")) return;
    await fetch(`/api/admin/marketing/banners?id=${id}`, { method: "DELETE" });
    banners.refresh();
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm("Delete this campaign?")) return;
    await fetch(`/api/admin/marketing/campaigns?id=${id}`, { method: "DELETE" });
    campaigns.refresh();
  };

  // ---- Featured categories ----

  const featuredItems = featured.data?.items ?? [];
  const categoryOptions = featured.data?.categories ?? [];

  const saveFeatured = async (items: FeaturedItem[]) => {
    await fetch("/api/admin/marketing/featured-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    featured.refresh();
  };

  const moveFeatured = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= featuredItems.length) return;
    const next = [...featuredItems];
    [next[index], next[to]] = [next[to], next[index]];
    saveFeatured(next);
  };

  const removeFeatured = (index: number) => {
    if (!confirm(`Stop featuring "${featuredItems[index].name}" on the homepage?`)) return;
    saveFeatured(featuredItems.filter((_, i) => i !== index));
  };

  const addFeatured = async () => {
    const option = categoryOptions.find((c) => c.slug === addCat);
    if (!option) return;
    const item: FeaturedItem = { name: option.name, caption: option.name, image: "", category: option.slug, sort: featuredItems.length };
    const next = [...featuredItems, item];
    await saveFeatured(next);
    setAddCat("");
    router.push(`/admin/marketing/featured-categories/${next.length - 1}`);
  };

  const openFeaturedEdit = (index: number) => {
    router.push(`/admin/marketing/featured-categories/${index}`);
  };

  const bannerList = banners.data?.banners ?? [];
  const unusedCategories = categoryOptions.filter((c) => !featuredItems.some((i) => i.category === c.slug));

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-safety-50 text-safety-600">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Marketing</h1>
            <p className="text-sm text-gray-500">
              Drive sales with homepage banners and promotional campaigns
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/admin/marketing/banners/new")}
            className="flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-safety-500"
          >
            <Plus className="h-4 w-4" /> New Banner
          </button>
          <button
            onClick={() => router.push("/admin/marketing/campaigns/new")}
            className="flex items-center gap-2 rounded-xl border border-safety-300 bg-safety-50 px-5 py-2.5 text-sm font-bold text-safety-700 hover:bg-safety-100"
          >
            <Plus className="h-4 w-4" /> New Campaign
          </button>
        </div>
      </div>

      <AdminCard
        title="Homepage Banner Manager"
        subtitle="Slides shown in the homepage hero slider — click a banner to edit it, toggle to show or hide"
        action={
          <button
            onClick={() => router.push("/admin/marketing/banners/new")}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-[11px] font-bold text-navy-900 hover:bg-surface"
          >
            <Plus className="h-3.5 w-3.5" /> New Banner
          </button>
        }
      >
        {banners.loading ? (
          <p className="py-8 text-center text-xs text-gray-400">Loading banners…</p>
        ) : bannerList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-xs text-gray-400">
            No banners yet — click “New Banner” to create your first hero slide.
          </p>
        ) : (
          <div className="space-y-2.5">
            {bannerList.map((b, i) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-3"
              >
                <button onClick={() => router.push(`/admin/marketing/banners/${b.id}`)} className="group relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-line bg-surface" title="Edit banner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image} alt={b.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <span
                    className={cn(
                      "absolute left-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-white",
                      b.active ? "bg-emerald-600" : "bg-gray-500"
                    )}
                  >
                    {b.active ? "LIVE" : "HIDDEN"}
                  </span>
                </button>
                <button
                  onClick={() => router.push(`/admin/marketing/banners/${b.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-display text-sm font-extrabold text-navy-900 hover:text-safety-600">{b.title}</p>
                  <p className="truncate text-[11px] text-gray-400">
                    {b.kicker} · {b.cta} → {b.cta_href}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleBanner(b)}
                    aria-label={b.active ? "Hide banner" : "Show banner"}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      b.active ? "bg-emerald-500" : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                        b.active ? "left-[22px]" : "left-0.5"
                      )}
                    />
                  </button>
                  <button
                    onClick={() => moveBanner(i, -1)}
                    disabled={i === 0}
                    aria-label="Move banner up"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveBanner(i, 1)}
                    disabled={i === bannerList.length - 1}
                    aria-label="Move banner down"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => router.push(`/admin/marketing/banners/${b.id}`)}
                    aria-label="Edit banner"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteBanner(b.id)}
                    aria-label="Delete banner"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {isSuper && (
        <AdminCard
          title="Featured Categories"
          subtitle="The category tiles shown in the homepage “Featured Categories” grid — choose which categories are featured, their order and images"
          action={
            <div className="flex items-center gap-2">
              <select
                value={addCat}
                onChange={(e) => setAddCat(e.target.value)}
                className="rounded-lg border border-line bg-white px-2.5 py-2 text-xs font-bold text-navy-900 outline-none focus:border-safety-400"
              >
                <option value="">Add a category…</option>
                {unusedCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={addFeatured}
                disabled={!addCat}
                className="flex items-center gap-1.5 rounded-lg border border-safety-300 bg-safety-50 px-3.5 py-2 text-[11px] font-bold text-safety-700 hover:bg-safety-100 disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          }
        >
          {featured.loading ? (
            <p className="py-8 text-center text-xs text-gray-400">Loading featured categories…</p>
          ) : featuredItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-xs text-gray-400">
              No featured categories yet — add some above.
            </p>
          ) : (
            <div className="space-y-2.5">
              {featuredItems.map((item, i) => (
                <div key={item.category + item.name} className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-3">
                  <button
                    onClick={() => openFeaturedEdit(i)}
                    className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-line bg-surface"
                    title="Edit tile"
                  >
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-navy-900">
                        <ImagePlus className="h-5 w-5 text-white/60" />
                      </span>
                    )}
                  </button>
                  <button onClick={() => openFeaturedEdit(i)} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-display text-sm font-extrabold text-navy-900 hover:text-safety-600">{item.name}</p>
                    <p className="truncate text-[11px] text-gray-400">
                      {item.caption} · /category/{item.category}
                    </p>
                    {!item.image && <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">No image set — click to add one</p>}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => moveFeatured(i, -1)}
                      disabled={i === 0}
                      aria-label="Move tile up"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => moveFeatured(i, 1)}
                      disabled={i === featuredItems.length - 1}
                      aria-label="Move tile down"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openFeaturedEdit(i)}
                      aria-label="Edit tile"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeFeatured(i)}
                      aria-label="Remove tile"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard
        title="Promotional Campaigns"
        subtitle="Seasonal campaigns shown as promotion cards on the homepage (auto-hide outside their date range)"
        action={
          <button
            onClick={() => router.push("/admin/marketing/campaigns/new")}
            className="flex items-center gap-1.5 rounded-lg border border-safety-300 bg-safety-50 px-3.5 py-2 text-[11px] font-bold text-safety-700 hover:bg-safety-100"
          >
            <Plus className="h-3.5 w-3.5" /> New Campaign
          </button>
        }
      >
        {campaigns.loading ? (
          <p className="py-8 text-center text-xs text-gray-400">Loading campaigns…</p>
        ) : (campaigns.data?.campaigns ?? []).length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-xs text-gray-400">
            No campaigns yet — create your first promotion.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(campaigns.data?.campaigns ?? []).map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition-all",
                  c.active ? "border-line" : "border-dashed border-gray-200 opacity-70"
                )}
              >
                <button
                  onClick={() => router.push(`/admin/marketing/campaigns/${c.id}`)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-navy-900"
                  title="Edit campaign"
                >
                  {c.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy-700 to-navy-900">
                      <span className="px-4 text-center font-display text-base font-extrabold text-white">{c.name}</span>
                    </div>
                  )}
                  <span
                    className={cn(
                      "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow",
                      c.active ? "bg-emerald-600" : "bg-gray-500"
                    )}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </span>
                  {c.discount_label && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-safety-500 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                      <Tag className="h-3 w-3" /> {c.discount_label}
                    </span>
                  )}
                  <span className="absolute bottom-3 left-3 right-3 truncate text-left font-display text-sm font-extrabold text-white drop-shadow">
                    {c.name}
                  </span>
                </button>
                <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                      <CalendarDays className="h-3 w-3 shrink-0 text-safety-600" />
                      <span className="truncate">{fmtDate(c.start_date)} → {fmtDate(c.end_date)}</span>
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-gray-300">/{c.slug}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => toggleCampaign(c)}
                      aria-label={c.active ? "Deactivate campaign" : "Activate campaign"}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        c.active ? "bg-emerald-500" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                          c.active ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => router.push(`/admin/marketing/campaigns/${c.id}`)}
                      aria-label="Edit campaign"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-500 hover:text-navy-900"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteCampaign(c.id)}
                      aria-label="Delete campaign"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-gray-400 hover:border-danger/40 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

    </div>
  );
}
