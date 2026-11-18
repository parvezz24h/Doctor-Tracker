"use client";

import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PaginationMeta } from "@/lib/api-client";
import { formatNumber } from "@/lib/format";

const PAGE_SIZES = [10, 20, 50];

export function PaginationBar({
  meta,
  onPageChange,
  onLimitChange,
  itemLabel,
}: {
  meta: PaginationMeta | undefined;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  itemLabel: string;
}) {
  if (!meta) return <div className="h-14 border-t" />;

  const { page, limit, total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{formatNumber(first)}</span>–
        <span className="font-medium text-foreground">{formatNumber(last)}</span> of{" "}
        <span className="font-medium text-foreground">{formatNumber(total)}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          Rows
          <Select value={String(limit)} onValueChange={(value) => onLimitChange(Number(value))}>
            <SelectTrigger size="sm" className="w-[4.5rem]" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(1)} aria-label="First page" className="hidden sm:inline-flex">
            <ChevronsLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-24 text-center text-sm tabular-nums">
            Page {formatNumber(page)} of {formatNumber(totalPages)}
          </span>
          <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(totalPages)} aria-label="Last page" className="hidden sm:inline-flex">
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
