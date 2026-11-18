"use client";

import { useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/shared/kbd";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

/**
 * Keeps its own text state and reports changes after a pause, so typing never
 * re-renders the table on every keystroke.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const notify = useDebouncedCallback(onChange, 350);

  // Follow external changes (back button, "clear filters") without an effect.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(value);
  }

  const update = (next: string, immediate = false) => {
    setText(next);
    if (immediate) {
      setSyncedValue(next);
      onChange(next);
    }
    notify(next.trim());
  };

  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={text}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        // Focused by the "/" keyboard shortcut.
        data-shortcut="search"
        className="h-10 pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {text ? (
        <button
          type="button"
          onClick={() => update("", true)}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : (
        <Kbd className="absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-flex">/</Kbd>
      )}
    </div>
  );
}
