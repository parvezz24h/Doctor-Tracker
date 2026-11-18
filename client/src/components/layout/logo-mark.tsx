import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Doctor Tracker mark: a medical cross with a heartbeat line running through it, on a
 * teal gradient tile. "Doctors" + "tracking" in one shape, legible down to 16px.
 * `variant="light"` is the white-tile version for coloured backgrounds.
 */
export function LogoMark({ className, variant = "brand" }: { className?: string; variant?: "brand" | "light" }) {
  const id = useId();
  const tile = `${id}-tile`;
  const shine = `${id}-shine`;
  const light = variant === "light";

  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("group/logo shrink-0", className)}>
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={light ? "#ffffff" : "#2dd4bf"} />
          <stop offset="0.55" stopColor={light ? "#f0fdfa" : "#0d9488"} />
          <stop offset="1" stopColor={light ? "#ccfbf1" : "#0e7490"} />
        </linearGradient>
        <radialGradient id={shine} cx="6" cy="4" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity={light ? 0 : 0.35} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="32" height="32" rx="9" fill={`url(#${tile})`} />
      <rect width="32" height="32" rx="9" fill={`url(#${shine})`} />

      {/* Rounded medical cross */}
      <path
        d="M13.4 6.5h5.2a1.6 1.6 0 0 1 1.6 1.6v3.7h3.7a1.6 1.6 0 0 1 1.6 1.6v5.2a1.6 1.6 0 0 1-1.6 1.6h-3.7v3.7a1.6 1.6 0 0 1-1.6 1.6h-5.2a1.6 1.6 0 0 1-1.6-1.6v-3.7H8.1a1.6 1.6 0 0 1-1.6-1.6v-5.2a1.6 1.6 0 0 1 1.6-1.6h3.7V8.1a1.6 1.6 0 0 1 1.6-1.6Z"
        fill={light ? "#0d9488" : "#ffffff"}
      />

      {/* Heartbeat line; redraws itself when the logo is hovered */}
      <path
        d="M8 16.2h4.1l1.6-3.4 2.6 6.6 1.9-4.6 1.2 1.4H24"
        fill="none"
        stroke={light ? "#ffffff" : "#0f766e"}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        className="[stroke-dashoffset:0] group-hover/logo:animate-[logo-pulse_1.1s_ease-out]"
      />
    </svg>
  );
}
