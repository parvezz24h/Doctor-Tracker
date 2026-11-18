import { Suspense } from "react";
import type { Metadata } from "next";
import { BarChart3Icon, ShieldCheckIcon, StethoscopeIcon } from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

const HIGHLIGHTS = [
  { icon: StethoscopeIcon, title: "Doctors and patients", text: "Search, filter and manage every record in one place." },
  { icon: BarChart3Icon, title: "Live analytics", text: "Admissions, conditions and workload at a glance." },
  { icon: ShieldCheckIcon, title: "Secure by default", text: "Every page and every request requires a signed-in administrator." },
];

function LoginFormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      {[0, 1].map((index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 [background:radial-gradient(60%_50%_at_15%_10%,white,transparent_70%),radial-gradient(45%_45%_at_90%_95%,white,transparent_70%)]"
        />
        <Brand tone="inverse" className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            One portal for your doctors, patients and admissions.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <item.icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm opacity-80">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs opacity-70">Authorized personnel only.</p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="animate-content-in w-full max-w-sm">
          <Brand />
          <h1 className="mt-10 text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">Sign in to manage doctors and patients.</p>
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
