"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { Loader2Icon, MoonIcon, PlusIcon, SearchIcon, UserIcon, XIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Kbd } from "@/components/shared/kbd";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { Doctor } from "@/features/doctors/api";
import { DoctorAvatar } from "@/features/doctors/components/doctor-avatar";
import type { Patient } from "@/features/patients/api";
import { ConditionBadge } from "@/features/patients/components/condition-badge";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useHotkey } from "@/hooks/use-hotkey";
import { apiGetPage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-items";

const PHONE = "(width < 40rem)";

function useQuickSearch(term: string) {
  const enabled = term.length >= 2;
  const doctors = useQuery({
    queryKey: ["quick-search", "doctors", term],
    queryFn: ({ signal }) => apiGetPage<Doctor>("/doctors", { search: term, limit: 5 }, signal),
    enabled,
    staleTime: 30_000,
  });
  const patients = useQuery({
    queryKey: ["quick-search", "patients", term],
    queryFn: ({ signal }) => apiGetPage<Patient>("/patients", { search: term, limit: 5 }, signal),
    enabled,
    staleTime: 30_000,
  });
  return {
    enabled,
    loading: enabled && (doctors.isFetching || patients.isFetching),
    doctors: doctors.data?.data ?? [],
    patients: patients.data?.data ?? [],
  };
}

/** Search text plus the debounced term sent to the server. */
function useSearchText() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const updateTerm = useDebouncedCallback((value: string) => setTerm(value.trim()), 250);
  return {
    input,
    term,
    setInput: (value: string) => {
      setInput(value);
      updateTerm(value);
    },
    reset: () => {
      setInput("");
      setTerm("");
    },
  };
}

/** Results shared by the top-bar dropdown and the phone search panel. */
function SearchResults({ input, term, onGo }: { input: string; term: string; onGo: (href: string) => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const results = useQuickSearch(term);
  const query = input.trim().toLowerCase();
  const pages = NAV_ITEMS.filter((item) => !query || item.label.toLowerCase().includes(query));
  const typing = query.length > 0;

  return (
    <>
      {results.loading ? (
        <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" /> Searching…
        </div>
      ) : null}
      {typing ? (
        <CommandEmpty>{results.enabled ? `No matches for “${input.trim()}”.` : "Keep typing to search records…"}</CommandEmpty>
      ) : null}

      {results.doctors.length > 0 ? (
        <CommandGroup heading="Doctors">
          {results.doctors.map((doctor) => (
            <CommandItem
              key={doctor._id}
              value={`doctor-${doctor._id}`}
              onSelect={() => onGo(`/doctors/${doctor._id}`)}
              // Hide the built-in check mark so the detail sits at the right edge.
              className="[&>svg:last-child]:hidden"
            >
              <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} className="size-7" fallbackClassName="text-[0.65rem]" />
              <span className="min-w-0 flex-1 truncate">{doctor.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{doctor.specialization}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {results.patients.length > 0 ? (
        <CommandGroup heading="Patients">
          {results.patients.map((patient) => (
            <CommandItem
              key={patient._id}
              value={`patient-${patient._id}`}
              onSelect={() => onGo(`/patients?q=${encodeURIComponent(patient.name)}`)}
              className="[&>svg:last-child]:hidden"
            >
              <UserIcon />
              <span className="min-w-0 flex-1 truncate">{patient.name}</span>
              <ConditionBadge condition={patient.condition} />
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {pages.length > 0 ? (
        <CommandGroup heading={typing ? "Pages" : "Go to"}>
          {pages.map((item) => (
            <CommandItem key={item.href} value={`page-${item.href}`} onSelect={() => onGo(item.href)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {!typing ? (
        <>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem value="action-add-doctor" onSelect={() => onGo("/doctors?new=1")}>
              <PlusIcon /> Add a doctor
            </CommandItem>
            <CommandItem value="action-add-patient" onSelect={() => onGo("/patients?new=1")}>
              <PlusIcon /> Add a patient
            </CommandItem>
            <CommandItem
              value="action-theme"
              onSelect={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                onGo("");
              }}
            >
              <MoonIcon /> Switch to {resolvedTheme === "dark" ? "light" : "dark"} theme
            </CommandItem>
          </CommandGroup>
        </>
      ) : null}
    </>
  );
}

function ShortcutHints() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> move
      </span>
      <span className="inline-flex items-center gap-1">
        <Kbd>Enter</Kbd> open
      </span>
      <span className="inline-flex items-center gap-1">
        <Kbd>Esc</Kbd> close
      </span>
      <span className="ml-auto inline-flex items-center gap-1">
        <Kbd>N</Kbd> add new
      </span>
    </div>
  );
}

/**
 * Search in the top bar. From tablet width up it is a real field: results drop down
 * under it as you type. On phones the icon opens a search panel instead.
 * Ctrl/Cmd+K focuses it from anywhere; "/" focuses the page's own search first.
 */
export function CommandMenu() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const inline = useSearchText();
  const panel = useSearchText();
  const [inlineOpen, setInlineOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const openSearch = () => {
    if (window.matchMedia(PHONE).matches) setPanelOpen(true);
    else inputRef.current?.focus();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (window.matchMedia(PHONE).matches) setPanelOpen((value) => !value);
        else inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useHotkey("/", () => {
    const pageSearch = document.querySelector<HTMLInputElement>('[data-shortcut="search"]');
    if (pageSearch) pageSearch.focus();
    else openSearch();
  });

  const goInline = (href: string) => {
    inline.reset();
    setInlineOpen(false);
    inputRef.current?.blur();
    if (href) router.push(href);
  };

  const goPanel = (href: string) => {
    panel.reset();
    setPanelOpen(false);
    if (href) router.push(href);
  };

  return (
    <>
      {/* Tablet and desktop: inline field with a results dropdown */}
      <CommandPrimitive
        shouldFilter={false}
        loop
        className="relative hidden sm:block"
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          if (inline.input) inline.reset();
          else inputRef.current?.blur();
        }}
      >
        <div
          className={cn(
            "flex h-10 w-56 items-center gap-2 rounded-xl border bg-background/70 px-3 transition-[width,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] md:w-64 lg:w-80 dark:bg-input/30",
            inlineOpen && "border-ring ring-3 ring-ring/30 lg:w-[26rem]",
          )}
        >
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <CommandPrimitive.Input
            ref={inputRef}
            value={inline.input}
            onValueChange={inline.setInput}
            onFocus={() => setInlineOpen(true)}
            onBlur={() => setInlineOpen(false)}
            placeholder="Search doctors, patients…"
            aria-label="Search doctors and patients"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
          {inline.input ? (
            <button
              type="button"
              aria-label="Clear search"
              // Keep focus in the field so the dropdown stays open.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => inline.reset()}
              className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : (
            <span className="hidden items-center gap-0.5 lg:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </span>
          )}
        </div>

        {inlineOpen ? (
          <div
            // Clicking a result must not blur the field before the click registers.
            onMouseDown={(event) => event.preventDefault()}
            className="animate-content-in absolute top-full right-0 z-50 mt-2 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl"
          >
            <CommandList className="max-h-[min(60vh,26rem)]">
              <SearchResults input={inline.input} term={inline.term} onGo={goInline} />
            </CommandList>
            <ShortcutHints />
          </div>
        ) : null}
      </CommandPrimitive>

      {/* Phones: icon that opens a search panel */}
      <Button variant="outline" size="icon" onClick={() => setPanelOpen(true)} className="sm:hidden" aria-label="Search doctors and patients">
        <SearchIcon />
      </Button>
      <CommandDialog
        open={panelOpen}
        onOpenChange={(next) => {
          setPanelOpen(next);
          if (!next) panel.reset();
        }}
        title="Search"
        description="Jump to a page, doctor or patient"
        className="sm:max-w-xl"
      >
        <Command shouldFilter={false}>
          <CommandInput value={panel.input} onValueChange={panel.setInput} placeholder="Search doctors, patients or pages…" />
          <CommandList className="max-h-[min(60vh,26rem)]">
            <SearchResults input={panel.input} term={panel.term} onGo={goPanel} />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
