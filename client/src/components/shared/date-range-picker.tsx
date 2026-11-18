"use client";

import { useState } from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Range = { from?: string; to?: string };

// Values are calendar days ("YYYY-MM-DD"); the server treats them as UTC days.
const pad = (value: number) => String(value).padStart(2, "0");
const toValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const toDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
};
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const shortFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const longFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function formatRange({ from, to }: Range) {
  if (!from && !to) return null;
  if (from && to && from === to) return longFormat.format(toDate(from));
  const sameYear = from && to && from.slice(0, 4) === to.slice(0, 4);
  const start = from ? (sameYear ? shortFormat : longFormat).format(toDate(from)) : "Any";
  const end = to ? longFormat.format(toDate(to)) : "today";
  return `${start} – ${end}`;
}

function presets(): Array<{ label: string; range: Range }> {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return [
    { label: "Today", range: { from: toValue(start), to: toValue(start) } },
    { label: "Yesterday", range: { from: toValue(addDays(start, -1)), to: toValue(addDays(start, -1)) } },
    { label: "Last 7 days", range: { from: toValue(addDays(start, -6)), to: toValue(start) } },
    { label: "Last 30 days", range: { from: toValue(addDays(start, -29)), to: toValue(start) } },
    { label: "This month", range: { from: toValue(new Date(start.getFullYear(), start.getMonth(), 1)), to: toValue(start) } },
    {
      label: "Last month",
      range: {
        from: toValue(new Date(start.getFullYear(), start.getMonth() - 1, 1)),
        to: toValue(new Date(start.getFullYear(), start.getMonth(), 0)),
      },
    },
    { label: "This year", range: { from: toValue(new Date(start.getFullYear(), 0, 1)), to: toValue(start) } },
  ];
}

/** Date range button with quick presets and a calendar. */
export function DateRangePicker({
  label,
  from,
  to,
  onChange,
  className,
  fullWidth = false,
}: {
  /** Stretch to the container (used in the phone filter sheet). */
  fullWidth?: boolean;
  /** What the dates refer to, e.g. "Admitted". */
  label: string;
  from: string | undefined;
  to: string | undefined;
  onChange: (range: Range) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const twoMonths = useMediaQuery("(min-width: 768px)");

  const active = Boolean(from || to);
  const selected: DateRange | undefined =
    draft ?? (from || to ? { from: from ? toDate(from) : undefined, to: to ? toDate(to) : undefined } : undefined);
  const today = toValue(new Date());

  const apply = (range: Range) => {
    onChange(range);
    setDraft(undefined);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setDraft(undefined);
      }}
    >
      <div className={cn("relative inline-flex", fullWidth && "w-full", className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 w-full justify-start font-normal",
              !fullWidth && "sm:w-auto",
              active ? "border-primary/50 pr-8" : "text-muted-foreground",
            )}
          >
            <CalendarIcon />
            <span className="truncate">
              {label}: <span className={cn(active && "font-medium text-foreground")}>{formatRange({ from, to }) ?? "Any time"}</span>
            </span>
          </Button>
        </PopoverTrigger>
        {active ? (
          <button
            type="button"
            aria-label={`Clear ${label.toLowerCase()} dates`}
            onClick={() => onChange({ from: undefined, to: undefined })}
            className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
      <PopoverContent align="end" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex gap-1 overflow-x-auto border-b p-2 sm:w-36 sm:flex-col sm:border-r sm:border-b-0">
            {presets().map((preset) => {
              const isActive = preset.range.from === from && preset.range.to === to;
              return (
                <Button
                  key={preset.label}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className="shrink-0 justify-start"
                  onClick={() => apply(preset.range)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <div className="p-1">
            <Calendar
              mode="range"
              numberOfMonths={twoMonths ? 2 : 1}
              defaultMonth={selected?.from ?? addDays(new Date(), twoMonths ? -31 : 0)}
              selected={selected}
              disabled={{ after: toDate(today) }}
              onSelect={(range) => {
                if (range?.from && range.to && draft?.from) {
                  apply({ from: toValue(range.from), to: toValue(range.to) });
                } else {
                  // First click starts a new range.
                  setDraft(range?.from ? { from: range.from, to: undefined } : undefined);
                }
              }}
            />
            <p className="px-3 pb-2 text-xs text-muted-foreground">
              {draft?.from ? "Now pick the end date." : "Pick a start date, or choose a preset."}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
