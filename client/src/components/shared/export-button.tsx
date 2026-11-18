import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Downloads the current filtered list as CSV (the session cookie authorises it). */
export function ExportButton({ href, label = "Export CSV" }: { href: string; label?: string }) {
  return (
    <Button asChild variant="outline" size="lg">
      <a href={href} download>
        <DownloadIcon /> <span className="hidden sm:inline">{label}</span>
      </a>
    </Button>
  );
}
