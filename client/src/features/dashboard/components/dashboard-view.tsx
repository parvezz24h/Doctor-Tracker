"use client";

import { useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ActivityIcon, ArrowRightIcon, HeartPulseIcon, StethoscopeIcon, UsersIcon } from "lucide-react";

import { ChartCardSkeleton, ChartSkeleton, StatCardSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useDashboardStats } from "../api";
import { StatCard } from "./stat-card";

// The charting library is only downloaded when the dashboard is opened.
const chartLoading = () => <ChartSkeleton />;
const AdmissionsChart = dynamic(() => import("./charts").then((module) => module.AdmissionsChart), { ssr: false, loading: chartLoading });
const PatientsPerDoctorChart = dynamic(() => import("./charts").then((module) => module.PatientsPerDoctorChart), { ssr: false, loading: chartLoading });
const ConditionChart = dynamic(() => import("./charts").then((module) => module.ConditionChart), { ssr: false, loading: chartLoading });
const SpecializationChart = dynamic(() => import("./charts").then((module) => module.SpecializationChart), { ssr: false, loading: chartLoading });

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

function RangeToggle({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  const activeIndex = RANGES.findIndex((range) => range.days === value);
  return (
    <div
      role="group"
      aria-label="Date range"
      className="relative grid grid-cols-3 rounded-xl border border-white/25 bg-white/15 p-1 backdrop-blur-sm"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-lg bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {RANGES.map((range) => (
        <button
          key={range.days}
          type="button"
          aria-pressed={range.days === value}
          onClick={() => onChange(range.days)}
          className={cn(
            "relative rounded-lg px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-white/60",
            range.days === value ? "text-teal-800" : "text-white/85 hover:text-white",
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

function subscribeToClock(onChange: () => void) {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/** Time-of-day greeting; the prerendered HTML uses a neutral one to avoid a mismatch. */
function useGreeting() {
  return useSyncExternalStore(
    subscribeToClock,
    () => {
      const hour = new Date().getHours();
      return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    },
    () => "Welcome back",
  );
}

const todayFormat = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

function WelcomeBanner({
  days,
  onDaysChange,
  admittedToday,
}: {
  days: number;
  onDaysChange: (days: number) => void;
  admittedToday: number | undefined;
}) {
  const greeting = useGreeting();
  const { data: session } = authClient.useSession();
  const firstName = session?.user.name.split(" ")[0];
  const today = useSyncExternalStore(subscribeToClock, () => todayFormat.format(new Date()), () => "");

  return (
    <section className="animate-page-in relative overflow-hidden rounded-2xl bg-linear-to-br from-teal-600 via-teal-700 to-cyan-800 p-6 text-white shadow-xl shadow-teal-900/20 dark:from-teal-800 dark:via-teal-900 dark:to-cyan-950 dark:shadow-black/30 sm:p-8">
      {/* Decorative glows */}
      <span aria-hidden className="animate-glow pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/15 blur-3xl" />
      <span aria-hidden className="animate-glow pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-cyan-300/20 blur-3xl [animation-delay:-6s]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/75">{today || "\u00a0"}</p>
          <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl">
            {greeting}
            {firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-2 max-w-xl text-base text-white/85">
            {admittedToday === undefined
              ? "Here is an overview of your doctors, patients and admissions."
              : admittedToday === 0
                ? "No admissions so far today. Here is how the last few weeks look."
                : `${formatNumber(admittedToday)} ${admittedToday === 1 ? "patient was" : "patients were"} admitted today. Here is the bigger picture.`}
          </p>
        </div>
        <RangeToggle value={days} onChange={onDaysChange} />
      </div>
    </section>
  );
}

function ChartCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("animate-content-in flex flex-col rounded-2xl border bg-card p-5", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {/* Grows to the card's height, so a chart can fill the space beside a taller card. */}
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCardSkeleton className="lg:col-span-2" />
        <ChartCardSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

export function DashboardView() {
  const [days, setDays] = useState(30);
  const { data, error, isPending, isError, isPlaceholderData, refetch } = useDashboardStats(days);

  return (
    <div className="space-y-6">
      <WelcomeBanner days={days} onDaysChange={setDays} admittedToday={data?.admissionsByDay.at(-1)?.count} />

      {isPending ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="rounded-xl border bg-card">
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index={0}
              label="Total doctors"
              value={data.totals.doctors}
              icon={StethoscopeIcon}
              href="/doctors"
              hint={`${data.totals.newDoctors} added in the last ${data.range.days} days`}
            />
            <StatCard
              index={1}
              label="Total patients"
              value={data.totals.patients}
              icon={UsersIcon}
              tone="blue"
              href="/patients"
              hint={`${data.totals.averagePatientsPerDoctor} per doctor on average`}
            />
            <StatCard
              index={2}
              label={`Admissions · ${data.range.days} days`}
              value={data.totals.admissions}
              icon={ActivityIcon}
              tone="amber"
              href={`/patients?from=${data.range.from.slice(0, 10)}`}
              change={data.totals.admissionsChange}
              hint="vs previous period"
            />
            <StatCard
              index={3}
              label="Critical patients"
              value={data.totals.critical}
              icon={HeartPulseIcon}
              tone="red"
              href="/patients?condition=critical"
              hint={
                data.totals.patients === 0
                  ? "No patients yet"
                  : `${((data.totals.critical / data.totals.patients) * 100).toFixed(1)}% of all patients`
              }
            />
          </div>

          {data.totals.patients === 0 ? (
            <div className="rounded-xl border bg-card">
              <EmptyState
                icon={ActivityIcon}
                title="No patient data yet"
                description="Charts appear here once doctors have patients."
                action={
                  <Button asChild size="lg">
                    <Link href="/doctors">Go to doctors</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard
                  title="Admissions over time"
                  description={`Patients admitted per day in the last ${data.range.days} days. Click a day to see who.`}
                  className="lg:col-span-2"
                >
                  {/* While a new range loads, shimmer replaces the chart but the card stays in place. */}
                  {isPlaceholderData ? <ChartSkeleton /> : <AdmissionsChart data={data.admissionsByDay} />}
                </ChartCard>
                <ChartCard title="Patients by condition" description="Click a condition to list those patients">
                  <ConditionChart data={data.patientsByCondition} />
                </ChartCard>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Patients per doctor"
                  description="Doctors with the most patients. Click a bar to open the doctor."
                  action={
                    <Button asChild variant="ghost" className="-mt-1 -mr-2 text-muted-foreground">
                      <Link href="/doctors">
                        All doctors <ArrowRightIcon />
                      </Link>
                    </Button>
                  }
                >
                  <PatientsPerDoctorChart data={data.patientsPerDoctor} />
                </ChartCard>
                <ChartCard title="Doctors by specialization" description="Click a bar to list those doctors">
                  <SpecializationChart data={data.doctorsBySpecialization} />
                </ChartCard>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-2xl sm:h-40" />
      <DashboardSkeleton />
    </div>
  );
}
