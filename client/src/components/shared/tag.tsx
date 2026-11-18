import { colorFor } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** Small coloured label, e.g. a specialization. The colour follows the text. */
export function Tag({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        colorFor(children),
        className,
      )}
    >
      {children}
    </span>
  );
}
