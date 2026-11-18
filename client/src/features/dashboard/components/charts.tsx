"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CONDITION_COLORS, CONDITION_LABELS } from "@/features/patients/constants";
import { chartColorFor } from "@/lib/colors";
import { formatDate, formatNumber, formatShortDate } from "@/lib/format";

import type { DashboardStats } from "../api";

/** Item under the pointer when a chart is clicked, or undefined. */
function clickedItem<T>(data: T[], state: { activeIndex?: unknown } | null | undefined) {
  const index = Number(state?.activeIndex);
  return Number.isInteger(index) ? data[index] : undefined;
}

const admissionsConfig = {
  count: { label: "Admissions", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function AdmissionsChart({ data }: { data: DashboardStats["admissionsByDay"] }) {
  const router = useRouter();
  return (
    <ChartContainer config={admissionsConfig} className="aspect-auto min-h-[280px] w-full flex-1 cursor-pointer">
      <AreaChart
        data={data}
        margin={{ left: 4, right: 12, top: 8 }}
        accessibilityLayer
        // Clicking a day lists the patients admitted that day.
        onClick={(state) => {
          const day = clickedItem(data, state);
          if (day) router.push(`/patients?from=${day.date}&to=${day.date}`);
        }}
      >
        <defs>
          <linearGradient id="admissions-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={32}
          tickFormatter={(value: string) => formatShortDate(value)}
        />
        <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} />
        <ChartTooltip
          cursor={{ strokeDasharray: "4 4" }}
          content={<ChartTooltipContent indicator="line" labelFormatter={(value) => formatDate(String(value))} />}
        />
        <Area
          dataKey="count"
          type="monotone"
          stroke="var(--color-count)"
          strokeWidth={2}
          fill="url(#admissions-fill)"
          animationDuration={600}
        />
      </AreaChart>
    </ChartContainer>
  );
}

const perDoctorConfig = {
  count: { label: "Patients", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function PatientsPerDoctorChart({ data }: { data: DashboardStats["patientsPerDoctor"] }) {
  const router = useRouter();
  return (
    <ChartContainer config={perDoctorConfig} className="aspect-auto w-full cursor-pointer" style={{ height: Math.max(200, data.length * 38) }}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 40 }}
        accessibilityLayer
        onClick={(state) => {
          const doctor = clickedItem(data, state);
          if (doctor) router.push(`/doctors/${doctor.doctorId}`);
        }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={150}
          tick={{ width: 150 }}
          tickFormatter={(value: string) => (value.length > 20 ? `${value.slice(0, 19)}…` : value)}
        />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={18} animationDuration={600}>
          <LabelList dataKey="count" position="right" className="fill-foreground text-xs font-medium" formatter={(value) => formatNumber(Number(value))} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const conditionConfig = {
  count: { label: "Patients" },
  stable: { label: CONDITION_LABELS.stable, color: CONDITION_COLORS.stable },
  critical: { label: CONDITION_LABELS.critical, color: CONDITION_COLORS.critical },
  recovering: { label: CONDITION_LABELS.recovering, color: CONDITION_COLORS.recovering },
  under_observation: { label: CONDITION_LABELS.under_observation, color: CONDITION_COLORS.under_observation },
} satisfies ChartConfig;

export function ConditionChart({ data }: { data: DashboardStats["patientsByCondition"] }) {
  const router = useRouter();
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col">
      <div className="relative shrink-0">
        <ChartContainer config={conditionConfig} className="aspect-square h-[200px] cursor-pointer">
          <PieChart
            accessibilityLayer
            onClick={(state) => {
              const slice = clickedItem(data, state);
              if (slice) router.push(`/patients?condition=${slice.condition}`);
            }}
          >
            <ChartTooltip content={<ChartTooltipContent nameKey="condition" hideLabel />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="condition"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              strokeWidth={0}
              animationDuration={600}
            >
              {data.map((item) => (
                <Cell key={item.condition} fill={`var(--color-${item.condition})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{formatNumber(total)}</span>
          <span className="text-xs text-muted-foreground">patients</span>
        </div>
      </div>

      <ul className="w-full space-y-1">
        {data.map((item) => {
          const share = total === 0 ? 0 : (item.count / total) * 100;
          return (
            <li key={item.condition}>
              <Link
                href={`/patients?condition=${item.condition}`}
                className="-mx-2 block rounded-lg px-2 py-1 transition-colors hover:bg-muted/70"
              >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: conditionConfig[item.condition].color }} />
                  {CONDITION_LABELS[item.condition]}
                </span>
                <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                  <span className="font-medium text-foreground">{formatNumber(item.count)}</span> · {share.toFixed(1)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{ width: `${share}%`, background: conditionConfig[item.condition].color }}
                />
              </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const specializationConfig = {
  count: { label: "Doctors", color: "var(--chart-5)" },
} satisfies ChartConfig;

export function SpecializationChart({ data }: { data: DashboardStats["doctorsBySpecialization"] }) {
  const router = useRouter();
  return (
    <ChartContainer config={specializationConfig} className="aspect-auto h-[280px] w-full cursor-pointer 2xl:h-[320px]">
      <BarChart
        data={data}
        margin={{ top: 20, left: 4, right: 4 }}
        accessibilityLayer
        onClick={(state) => {
          const item = clickedItem(data, state);
          if (item) router.push(`/doctors?specialization=${encodeURIComponent(item.specialization)}`);
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="specialization"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={0}
          tickFormatter={(value: string) => (value.length > 9 ? `${value.slice(0, 8)}…` : value)}
        />
        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={600}>
          {/* Same colour as the specialization's tag elsewhere in the app. */}
          {data.map((item) => (
            <Cell key={item.specialization} fill={chartColorFor(item.specialization)} />
          ))}
          <LabelList dataKey="count" position="top" className="fill-foreground text-xs font-medium" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
