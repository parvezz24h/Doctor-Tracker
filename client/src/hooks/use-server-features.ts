"use client";

import { useQuery } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";

type ServerFeatures = { photoUploads: boolean };

/** Optional server features (for example photo storage) that the UI shows or hides. */
export function useServerFeatures() {
  return useQuery({
    queryKey: ["meta"],
    queryFn: ({ signal }) => apiGet<ServerFeatures>("/meta", undefined, signal),
    staleTime: Infinity,
  });
}
