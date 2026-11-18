"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getErrorMessage } from "@/lib/api-client";

import { useUpdatePatientCondition, type Patient } from "../api";
import { CONDITION_COLORS, CONDITION_LABELS, CONDITIONS } from "../constants";
import { ConditionBadge } from "./condition-badge";

/** The condition badge doubles as a menu to change it in place. */
export function ConditionMenu({ patient }: { patient: Pick<Patient, "_id" | "name" | "condition"> }) {
  const updateCondition = useUpdatePatientCondition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Change condition for ${patient.name} (now ${CONDITION_LABELS[patient.condition]})`}
        className="group/condition inline-flex items-center gap-0.5 rounded-full outline-none transition-transform focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95"
      >
        <ConditionBadge condition={patient.condition} />
        <ChevronDownIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/condition:opacity-100 group-focus-visible/condition:opacity-100 group-data-[state=open]/condition:opacity-100" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Set condition</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CONDITIONS.map((condition) => (
          <DropdownMenuItem
            key={condition}
            onSelect={() => {
              if (condition === patient.condition) return;
              updateCondition.mutate(
                { id: patient._id, condition },
                {
                  onSuccess: () => toast.success(`${patient.name} is now ${CONDITION_LABELS[condition].toLowerCase()}`),
                  onError: (error) =>
                    toast.error(`Could not update ${patient.name}`, { description: getErrorMessage(error) }),
                },
              );
            }}
          >
            <span className="size-2.5 rounded-full" style={{ background: CONDITION_COLORS[condition] }} />
            {CONDITION_LABELS[condition]}
            {condition === patient.condition ? <CheckIcon className="ml-auto text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
