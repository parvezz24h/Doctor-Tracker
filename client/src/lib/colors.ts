/**
 * Stable colour per name, so the same doctor, patient or specialization always gets the
 * same tint everywhere: avatars, tags and chart bars. Class names are written out in
 * full so Tailwind generates them; `chart` is the matching solid colour for SVG fills.
 */
const PALETTE = [
  { className: "bg-teal-500/15 text-teal-700 dark:text-teal-300", chart: "oklch(0.704 0.14 182.5)" },
  { className: "bg-sky-500/15 text-sky-700 dark:text-sky-300", chart: "oklch(0.685 0.169 237.3)" },
  { className: "bg-violet-500/15 text-violet-700 dark:text-violet-300", chart: "oklch(0.606 0.25 292.7)" },
  { className: "bg-rose-500/15 text-rose-700 dark:text-rose-300", chart: "oklch(0.645 0.246 16.4)" },
  { className: "bg-amber-500/20 text-amber-800 dark:text-amber-300", chart: "oklch(0.769 0.188 70.1)" },
  { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", chart: "oklch(0.696 0.17 162.5)" },
  { className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300", chart: "oklch(0.585 0.233 277.1)" },
  { className: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300", chart: "oklch(0.667 0.295 322.2)" },
  { className: "bg-orange-500/15 text-orange-700 dark:text-orange-300", chart: "oklch(0.705 0.213 47.6)" },
  { className: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300", chart: "oklch(0.715 0.143 215.2)" },
] as const;

function pick(key: string) {
  let hash = 0;
  for (let index = 0; index < key.length; index++) hash = (hash * 31 + key.charCodeAt(index)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length]!;
}

/** Tint classes (background + text) for a name. */
export const colorFor = (key: string) => pick(key).className;

/** Solid colour for the same name, for charts. */
export const chartColorFor = (key: string) => pick(key).chart;
