export const GENDERS = ["male", "female", "other"] as const;
export const CONDITIONS = ["stable", "critical", "recovering", "under_observation"] as const;

export type Gender = (typeof GENDERS)[number];
export type Condition = (typeof CONDITIONS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  stable: "Stable",
  critical: "Critical",
  recovering: "Recovering",
  under_observation: "Under observation",
};

/** Colour per condition, shared by badges, charts and legends. */
export const CONDITION_COLORS: Record<Condition, string> = {
  stable: "oklch(0.7 0.15 160)",
  critical: "oklch(0.64 0.21 25)",
  recovering: "oklch(0.68 0.14 235)",
  under_observation: "oklch(0.78 0.15 80)",
};

export const GENDER_OPTIONS = GENDERS.map((value) => ({ value, label: GENDER_LABELS[value] }));
export const CONDITION_OPTIONS = CONDITIONS.map((value) => ({ value, label: CONDITION_LABELS[value] }));
