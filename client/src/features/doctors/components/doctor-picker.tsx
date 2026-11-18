"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { apiGetPage } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import type { Doctor } from "../api";
import { DoctorAvatar } from "./doctor-avatar";

export type PickedDoctor = Pick<Doctor, "_id" | "name" | "specialization" | "photoUrl">;

/** Searchable doctor dropdown; searches the server as you type. */
export function DoctorPicker({
  id,
  value,
  onChange,
  invalid,
  disabled,
}: {
  id: string;
  value: PickedDoctor | null;
  onChange: (doctor: PickedDoctor) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const updateTerm = useDebouncedCallback((next: string) => setTerm(next.trim()), 250);

  const { data, isFetching } = useQuery({
    queryKey: ["doctor-picker", term],
    queryFn: ({ signal }) =>
      apiGetPage<Doctor>("/doctors", { search: term || undefined, limit: 8, sortBy: "name", order: "asc" }, signal),
    enabled: open,
    staleTime: 60_000,
  });
  const doctors = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid}
          disabled={disabled}
          className={cn("h-11 w-full justify-between px-2.5 font-normal", !value && "text-muted-foreground")}
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2.5">
              <DoctorAvatar name={value.name} photoUrl={value.photoUrl} className="size-7" fallbackClassName="text-[0.65rem]" />
              <span className="truncate font-medium text-foreground">{value.name}</span>
              <span className="truncate text-xs text-muted-foreground">{value.specialization}</span>
            </span>
          ) : (
            "Choose a doctor"
          )}
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={(next) => {
              setInput(next);
              updateTerm(next);
            }}
            placeholder="Search by name, specialization or hospital"
          />
          <CommandList>
            {isFetching && doctors.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" /> Loading doctors…
              </div>
            ) : (
              <CommandEmpty>No doctors found.</CommandEmpty>
            )}
            {doctors.length > 0 ? (
              <CommandGroup>
                {doctors.map((doctor) => (
                  <CommandItem
                    key={doctor._id}
                    value={doctor._id}
                    onSelect={() => {
                      onChange(doctor);
                      setOpen(false);
                    }}
                    className="[&>svg:last-child]:hidden"
                  >
                    <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} className="size-7" fallbackClassName="text-[0.65rem]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{doctor.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {doctor.specialization} · {doctor.hospital}
                      </span>
                    </span>
                    {value?._id === doctor._id ? <CheckIcon className="text-primary" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
