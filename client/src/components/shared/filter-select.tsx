"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

export type FilterOption = { value: string; label: string };

/** A select whose first entry clears the filter. */
export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  label,
  className,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: FilterOption[];
  /** Label of the "no filter" entry, e.g. "All conditions". Omit for a required select. */
  allLabel?: string;
  label: string;
  className?: string;
}) {
  return (
    <Select
      value={value ?? (allLabel ? ALL : undefined)}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    >
      <SelectTrigger aria-label={label} className={cn("w-full data-[size=default]:h-10 sm:w-44", allLabel && value && "border-primary/50", className)}>
        {/* Text given directly, so the label shows before the menu's items have mounted. */}
        <SelectValue placeholder={label}>
          {value ? (options.find((option) => option.value === value)?.label ?? value) : (allLabel ?? label)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allLabel ? <SelectItem value={ALL}>{allLabel}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
