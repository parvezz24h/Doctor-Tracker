import { cn } from "@/lib/utils";

import { CONDITION_LABELS, type Condition } from "../constants";

const STYLES: Record<Condition, string> = {
  stable: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  critical: "bg-red-500/10 text-red-700 dark:text-red-400",
  recovering: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  under_observation: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const DOTS: Record<Condition, string> = {
  stable: "bg-emerald-500",
  critical: "bg-red-500",
  recovering: "bg-sky-500",
  under_observation: "bg-amber-500",
};

export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STYLES[condition],
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOTS[condition])} />
      {CONDITION_LABELS[condition]}
    </span>
  );
}
