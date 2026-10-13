"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const COOKIE_NAME = "outzy_geo";
const MAX_AGE_SEC = 3600;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function LandingGeoSync() {
  const router = useRouter();
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    if (readCookie(COOKIE_NAME)) return;
    if (!navigator.geolocation) return;

    tried.current = true;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
        const value = `${latitude},${longitude}`;
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${MAX_AGE_SEC}; samesite=lax`;
        router.refresh();
      },
      () => {
        /* denied or unavailable — interest / soonest sort on server */
      },
      { maximumAge: MAX_AGE_SEC * 1000, timeout: 8000 },
    );
  }, [router]);

  return null;
}
