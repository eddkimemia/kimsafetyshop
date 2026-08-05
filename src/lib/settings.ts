"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

let cached: Record<string, string> | null = null;

export async function fetchSettings(): Promise<Record<string, string>> {
  if (cached) return cached;
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    cached = { ...DEFAULT_SETTINGS, ...(json.settings ?? {}) };
  } catch {
    cached = { ...DEFAULT_SETTINGS };
  }
  return cached ?? { ...DEFAULT_SETTINGS };
}

export function useSettings(): Record<string, string> {
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  useEffect(() => {
    let active = true;
    fetchSettings().then((s) => {
      if (active) setSettings(s);
    });
    return () => {
      active = false;
    };
  }, []);
  return settings;
}
