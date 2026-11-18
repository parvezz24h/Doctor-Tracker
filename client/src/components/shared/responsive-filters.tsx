"use client";

import { useState } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Filters inline from tablet width up; on phones a "Filters" button (with the number of
 * active filters) opens them in a bottom sheet, so the list starts near the top of the screen.
 * `render` receives where the controls are drawn, so they can be full width in the sheet.
 */
export function ResponsiveFilters({
  activeCount,
  onClear,
  render,
}: {
  activeCount: number;
  onClear: () => void;
  render: (placement: "inline" | "sheet") => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden flex-wrap items-center gap-2 md:flex">{render("inline")}</div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="lg" className="flex-1 md:hidden">
            <SlidersHorizontalIcon />
            Filters
            {activeCount > 0 ? (
              <span className="animate-content-in flex size-5 items-center justify-center rounded-full bg-primary text-[0.7rem] font-bold text-primary-foreground">
                {activeCount}
              </span>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl md:hidden">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>Narrow the list. Changes apply right away.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 overflow-y-auto px-4">{render("sheet")}</div>
          <SheetFooter className="flex-row">
            <Button variant="outline" size="lg" className="flex-1" disabled={activeCount === 0} onClick={onClear}>
              Clear filters
            </Button>
            <Button size="lg" className="flex-1" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
