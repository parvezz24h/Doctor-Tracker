import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colorFor } from "@/lib/colors";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Doctor photo with an initials fallback while it loads or when there is none. */
export function DoctorAvatar({
  name,
  photoUrl,
  shape = "circle",
  className,
  fallbackClassName,
}: {
  name: string;
  photoUrl: string | null | undefined;
  shape?: "circle" | "rounded";
  className?: string;
  fallbackClassName?: string;
}) {
  const rounded = shape === "rounded" ? "rounded-2xl after:rounded-2xl" : undefined;
  return (
    <Avatar className={cn(rounded, className)}>
      {photoUrl ? (
        <AvatarImage
          src={photoUrl}
          alt=""
          loading="lazy"
          className={cn(shape === "rounded" && "rounded-2xl", "animate-content-in")}
        />
      ) : null}
      <AvatarFallback
        className={cn("font-semibold", colorFor(name), rounded, fallbackClassName)}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
