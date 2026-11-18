import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { colorFor } from "@/lib/colors";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Initials on a colour picked from the name. */
export function NameAvatar({ name, className, fallbackClassName }: { name: string; className?: string; fallbackClassName?: string }) {
  return (
    <Avatar className={className}>
      <AvatarFallback className={cn("font-semibold", colorFor(name), fallbackClassName)}>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
