"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { useDoctor } from "@/features/doctors/api";

import { NAV_ITEMS } from "./nav-items";

/** Current page (and doctor name on a doctor page) shown in the header on desktop. */
export function PageTitle() {
  const pathname = usePathname();
  const section = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const doctorId = pathname.match(/^\/doctors\/([^/]+)$/)?.[1];
  // Only reads what the doctor page fetches. Fetching here too would let the header
  // finish first and change the page body before it hydrates (a hydration mismatch).
  const { data: doctor } = useDoctor(doctorId ?? "", { enabled: false });

  if (!section) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
      {doctorId ? (
        <>
          <Link href={section.href} className="text-muted-foreground transition-colors hover:text-foreground">
            {section.label}
          </Link>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{doctor?.name ?? "Doctor"}</span>
        </>
      ) : (
        <span className="font-medium">{section.label}</span>
      )}
    </nav>
  );
}
