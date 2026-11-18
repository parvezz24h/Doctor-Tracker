"use client";

import { useId } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { CONDITION_COLORS, CONDITION_LABELS, type Condition } from "@/features/patients/constants";
import { useQueryParams } from "@/hooks/use-query-params";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useDoctorStats } from "../api";

/** Tiny area chart drawn as plain SVG, so the doctor page does not load a chart library. */
function Sparkline({ values }: { values: number[] }) {
  const gradientId = useId();
  const width = 240;
  const height = 48;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => [index * step, height - 4 - (value / max) * (height - 8)] as const);
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-12 w-full" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

export function DoctorStatsSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6" aria-hidden>
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-5 h-12 w-full" />
      <Skeleton className="mt-5 h-2 w-full rounded-full" />
    </div>
  );
}

/** Admissions trend and condition mix for one doctor. Clicking a condition filters the list below. */
export function DoctorStats({ doctorId }: { doctorId: string }) {
  const { data, isPending, isError } = useDoctorStats(doctorId);
  const { get, setParams } = useQueryParams();
  const activeCondition = get("condition");

  if (isPending) return <DoctorStatsSkeleton />;
  if (isError) return null;

  const total = data.patientsByCondition.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="animate-content-in rounded-xl border bg-card p-6" aria-label="Patient overview">
      <h2 className="text-sm font-semibold">Patient overview</h2>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <Metric label="Last 30 days" value={formatNumber(data.admissionsInRange)} />
        <Metric label="Avg. age" value={data.averageAge === null ? "—" : String(data.averageAge)} />
        <Metric label="Last admitted" value={data.lastAdmission ? formatDate(data.lastAdmission).replace(/, \d{4}$/, "") : "—"} />
      </div>

      <div className="mt-4">
        <Sparkline values={data.admissionsByDay.map((day) => day.count)} />
        <p className="mt-1 text-xs text-muted-foreground">Admissions per day, last 30 days</p>
      </div>

      {total > 0 ? (
        <div className="mt-5">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {data.patientsByCondition.map((item) =>
              item.count > 0 ? (
                <div
                  key={item.condition}
                  style={{ width: `${(item.count / total) * 100}%`, background: CONDITION_COLORS[item.condition] }}
                  className="h-full transition-[width] duration-500"
                />
              ) : null,
            )}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-1">
            {data.patientsByCondition.map((item) => {
              const active = activeCondition === item.condition;
              return (
                <li key={item.condition}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setParams({ condition: active ? undefined : (item.condition as Condition) })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                      active && "bg-muted font-medium",
                    )}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: CONDITION_COLORS[item.condition] }} />
                    <span className="truncate">{CONDITION_LABELS[item.condition]}</span>
                    <span className="ml-auto text-muted-foreground tabular-nums">{item.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
