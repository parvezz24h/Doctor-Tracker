"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageUpIcon, Trash2Icon, UndoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DoctorAvatar } from "./doctor-avatar";

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** What should happen to the photo when the form is saved. */
export type PhotoChange = { kind: "keep" } | { kind: "set"; file: File } | { kind: "remove" };

export function PhotoField({
  name,
  currentUrl,
  value,
  onChange,
  disabled,
}: {
  /** Doctor name, used for the initials placeholder. */
  name: string;
  currentUrl: string | null;
  value: PhotoChange;
  onChange: (value: PhotoChange) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = useMemo(
    () => (value.kind === "set" ? URL.createObjectURL(value.file) : null),
    [value],
  );

  // Object URLs keep the file in memory until they are revoked.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownUrl = value.kind === "set" ? previewUrl : value.kind === "remove" ? null : currentUrl;
  const hasPhoto = Boolean(shownUrl);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError("Photo must be 5 MB or smaller.");
      return;
    }
    setError(null);
    onChange({ kind: "set", file });
  };

  return (
    <div className="space-y-1.5">
      <span className="text-sm leading-none font-medium select-none">Photo</span>
      <div
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) pick(event.dataTransfer.files[0]);
        }}
        className={cn(
          "flex items-center gap-4 rounded-xl border border-dashed p-3 transition-colors duration-150",
          dragging ? "border-primary bg-primary/5" : "border-border",
        )}
      >
        <DoctorAvatar
          name={name || "?"}
          photoUrl={shownUrl}
          className="size-16"
          fallbackClassName="text-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <ImageUpIcon /> {hasPhoto ? "Change" : "Upload photo"}
            </Button>
            {value.kind !== "keep" && currentUrl ? (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange({ kind: "keep" })}>
                <UndoIcon /> Undo
              </Button>
            ) : null}
            {hasPhoto ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="text-destructive hover:text-destructive"
                onClick={() => onChange(currentUrl ? { kind: "remove" } : { kind: "keep" })}
              >
                <Trash2Icon /> Remove
              </Button>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            JPG, PNG or WebP up to 5 MB. Drag an image here or choose a file.
          </p>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={PHOTO_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-label="Doctor photo"
          onChange={(event) => {
            pick(event.target.files?.[0]);
            // Allow choosing the same file again after removing it.
            event.target.value = "";
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="animate-content-in text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
