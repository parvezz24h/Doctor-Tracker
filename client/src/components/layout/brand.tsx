import { cn } from "@/lib/utils";

import { LogoMark } from "./logo-mark";

export function Brand({ className, tone = "default" }: { className?: string; tone?: "default" | "inverse" }) {
  const inverse = tone === "inverse";
  return (
    <div className={cn("group/logo flex items-center gap-2.5", className)}>
      <LogoMark
        variant={inverse ? "light" : "brand"}
        className={cn(
          "size-9 rounded-[0.6rem] transition-transform duration-300 group-hover/logo:-rotate-6 group-hover/logo:scale-105",
          !inverse && "shadow-md shadow-teal-700/25",
        )}
      />
      <div className="leading-tight lg:in-[aside]:sidebar-collapsed:sr-only">
        <p className="text-[0.95rem] font-bold tracking-tight">
          Doctor<span className={inverse ? "text-teal-100" : "text-primary"}>Tracker</span>
        </p>
        <p className={cn("text-xs", inverse ? "text-white/70" : "text-muted-foreground")}>Admin portal</p>
      </div>
    </div>
  );
}
