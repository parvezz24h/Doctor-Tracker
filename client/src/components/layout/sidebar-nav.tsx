"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

/** Height of one nav row plus the gap between rows, in pixels. */
const ROW_STEP = 44;

function NavLinks({ activeIndex, onNavigate }: { activeIndex: number; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="relative flex flex-col gap-1">
      {/* One indicator that slides between items instead of each item toggling its own background. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-10 rounded-lg bg-primary shadow-md shadow-primary/25 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          activeIndex < 0 && "opacity-0",
        )}
        style={{ transform: `translateY(${Math.max(activeIndex, 0) * ROW_STEP}px)` }}
      >
      </span>

      {NAV_ITEMS.map((item, index) => {
        const active = index === activeIndex;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground [&:hover>svg]:scale-110",
                )}
              >
                <item.icon className="size-[1.125rem] shrink-0 transition-transform duration-200" />
                <span className="lg:sidebar-collapsed:sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            {/* Labels are hidden when the sidebar is collapsed, so the name shows on hover instead. */}
            <TooltipContent side="right" className="sidebar-expanded:hidden max-lg:hidden">
              {item.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return <NavLinks activeIndex={activeIndex} onNavigate={onNavigate} />;
}

/** Rendered while the pathname is not yet known (prerendered shell of dynamic routes). */
export function SidebarNavFallback() {
  return <NavLinks activeIndex={-1} />;
}
