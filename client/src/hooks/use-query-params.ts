"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

type Updates = Record<string, string | number | undefined | null>;

/**
 * List state (page, search, filters) lives in the URL so views are shareable and
 * the back button works. Updates go through the History API, which Next.js syncs
 * with `useSearchParams` without a server round trip.
 */
export function useQueryParams() {
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Updates, options: { history?: "push" | "replace" } = {}) => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      // Any filter change invalidates the current page number.
      if (!("page" in updates)) next.delete("page");

      const queryString = next.toString();
      const url = queryString ? `?${queryString}` : window.location.pathname;
      if (options.history === "replace") window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [],
  );

  const get = useCallback((key: string) => searchParams.get(key) ?? undefined, [searchParams]);

  return { get, setParams };
}

export function parsePage(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
