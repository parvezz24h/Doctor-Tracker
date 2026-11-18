"use client";

import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ActiveFilter = { key: string; label: string; value: string; onRemove: () => void };

/** Removable chips for every filter in effect, so a short list is never a mystery. */
export function ActiveFilters({ filters, onClearAll }: { filters: ActiveFilter[]; onClearAll: () => void }) {
  if (filters.length === 0) return null;
  return (
    <div className="animate-content-in flex flex-wrap items-center gap-2 border-b px-4 py-2.5" aria-label="Active filters">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex h-7 items-center gap-1 rounded-full border bg-muted/50 pr-1 pl-3 text-xs"
        >
          <span className="text-muted-foreground">{filter.label}:</span>
          <span className="max-w-48 truncate font-medium">{filter.value}</span>
          <button
            type="button"
            onClick={filter.onRemove}
            aria-label={`Remove ${filter.label} filter`}
            className="ml-0.5 flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="xs" onClick={onClearAll} className="text-muted-foreground">
        Clear all
      </Button>
    </div>
  );
}
