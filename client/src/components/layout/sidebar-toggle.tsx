"use client";

import { useEffect, useSyncExternalStore } from "react";

import { Kbd } from "@/components/shared/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const NARROW = "(width < 80rem)";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-sidebar"] });
  const media = window.matchMedia(NARROW);
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** Mirrors the `sidebar-collapsed` CSS variant: an explicit choice wins, else narrow screens collapse. */
function isCollapsed() {
  const choice = document.documentElement.dataset.sidebar;
  if (choice === "collapsed") return true;
  if (choice === "expanded") return false;
  return window.matchMedia(NARROW).matches;
}

function toggleSidebar() {
  const next = isCollapsed() ? "expanded" : "collapsed";
  document.documentElement.dataset.sidebar = next;
  try {
    localStorage.setItem("sidebar", next);
  } catch {
    // Private mode: the choice just isn't remembered.
  }
}

/**
 * Desktop sidebar toggle for the top bar. The three lines morph between a
 * "menu" shape and a "collapsed" shape. State lives on <html> and in localStorage.
 */
export function SidebarToggle({ className }: { className?: string }) {
  const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => false);

  // Ctrl/Cmd+B, the shortcut most editors use for a sidebar.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "b" && (event.ctrlKey || event.metaKey) && !event.altKey) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={label}
          aria-expanded={!collapsed}
          className={cn(
            "group relative flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,color,transform] duration-200 outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95",
            className,
          )}
        >
          <span aria-hidden className="relative block h-3.5 w-[1.125rem]">
            {/* Top and bottom lines keep full width; the middle one shortens and slides. */}
            <span className="absolute top-0 left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:w-[85%]" />
            <span
              className={cn(
                "absolute top-1/2 left-0 h-0.5 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                collapsed ? "w-full" : "w-[60%]",
              )}
            />
            <span
              className={cn(
                "absolute bottom-0 left-0 h-0.5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                collapsed ? "w-[60%]" : "w-full",
              )}
            />
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {label}
        <span className="flex gap-0.5">
          <Kbd className="h-4 min-w-4 border-background/20 bg-background/15 text-[0.65rem] text-background">Ctrl</Kbd>
          <Kbd className="h-4 min-w-4 border-background/20 bg-background/15 text-[0.65rem] text-background">B</Kbd>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
