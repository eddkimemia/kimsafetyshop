"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

// Short TTL so a branding/contact update in Admin → Settings reaches the
// storefront quickly. Branding assets additionally carry a ?v= cache-buster
// (see brandedUrl) derived from the settings version, so the browser never
// shows a stale uploaded logo even within the TTL window.
const CACHE_TTL_MS = 60 * 1000;

let cached: { at: number; data: Record<string, string>; version: string } | null = null;

export async function fetchSettings(force = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!force && cached && now - cached.at < CACHE_TTL_MS) return cached.data;
  let data: Record<string, string>;
  let version = "0";
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    data = { ...DEFAULT_SETTINGS, ...(json.settings ?? {}) };
    version = typeof json.version === "string" ? json.version : "0";
  } catch {
    if (cached) return cached.data;
    data = { ...DEFAULT_SETTINGS };
  }
  cached = { at: now, data, version };
  return data;
}

export function settingsVersion(): string {
  return cached?.version ?? "0";
}

/**
 * Appends the settings version to local branding asset URLs (logo). When the
 * admin saves new settings the URL changes, defeating both the browser cache
 * and the Next.js image optimizer cache.
 */
export function brandedUrl(pathOrUrl: string): string {
  if (!pathOrUrl || /^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const v = settingsVersion();
  if (!v || v === "0") return pathOrUrl;
  return `${pathOrUrl}${pathOrUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(v)}`;
}

/** Drops the memoized copy — called right after an admin saves settings. */
export function invalidateClientSettings() {
  cached = null;
}

export function useSettings(): Record<string, string> {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  useEffect(() => {
    let active = true;
    // Force a network fetch on mount so an updated logo/name is picked up
    // immediately instead of after the TTL window.
    fetchSettings(true).then((s) => {
      if (active) setSettings(s);
    });
    // Pick up cross-tab updates: another tab saved new settings.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      fetchSettings(true).then((s) => {
        if (active) setSettings(s);
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "kimsafety-settings-version") return;
      fetchSettings(true).then((s) => {
        if (active) setSettings(s);
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return settings;
}
