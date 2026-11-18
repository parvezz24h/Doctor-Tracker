import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control + animated error message. Pass the same `id` to the control. */
export function FormField({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="animate-content-in text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
