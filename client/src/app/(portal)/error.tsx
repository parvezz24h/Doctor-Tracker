"use client";

import { ErrorState } from "@/components/shared/states";

export default function PortalError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState message={error.message || "An unexpected error occurred."} onRetry={reset} />;
}
