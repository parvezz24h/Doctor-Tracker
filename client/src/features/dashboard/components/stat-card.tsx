"use client";

import Link from "next/link";
import { ArrowUpRightIcon, TrendingDownIcon, TrendingUpIcon, type LucideIcon } from "lucide-react";

import { useCountUp } from "@/hooks/use-count-up";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  change,
  decimals = 0,
  tone = "primary",
  href,
  index = 0,
}: {
  /** Position in the row, used to stagger the entrance. */
  index?: number;
  /** Page with the records behind this number. */
  href: string;
  label: string;
  value: number;
  icon: LucideIcon;
  hint: string;
  /** Percent change shown as a trend chip. */
  change?: number | null;
  decimals?: number;
  tone?: "primary" | "blue" | "amber" | "red";
}) {
  const animated = useCountUp(value);
  const display = decimals > 0 ? animated.toFixed(decimals) : formatNumber(Math.round(animated));

  // Solid icon tile plus a soft wash of the same colour across the card.
  const tones = {
    primary: { icon: "bg-primary text-primary-foreground shadow-primary/30", wash: "to-primary/10", glow: "bg-primary/20" },
    blue: { icon: "bg-blue-500 text-white shadow-blue-500/30", wash: "to-blue-500/10", glow: "bg-blue-500/20" },
    amber: { icon: "bg-amber-500 text-white shadow-amber-500/30", wash: "to-amber-500/10", glow: "bg-amber-500/20" },
    red: { icon: "bg-rose-500 text-white shadow-rose-500/30", wash: "to-rose-500/10", glow: "bg-rose-500/20" },
  }[tone];

  return (
    <Link
      href={href}
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "group animate-stagger relative block overflow-hidden rounded-2xl border bg-linear-to-br from-card from-40% p-5 transition-[transform,box-shadow] duration-300 outline-none hover:-translate-y-1 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-0",
        tones.wash,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          tones.glow,
        )}
      />
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
          {label}
          <ArrowUpRightIcon className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </p>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            tones.icon,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="relative mt-3 text-[2rem] leading-tight font-bold tracking-tight tabular-nums">{display}</p>
      <div className="relative mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        {typeof change === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium",
              change >= 0
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400",
            )}
          >
            {change >= 0 ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        ) : null}
        <span className="truncate">{hint}</span>
      </div>
    </Link>
  );
}
