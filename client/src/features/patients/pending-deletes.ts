"use client";

import { useSyncExternalStore } from "react";

/**
 * Deletes that wait a few seconds before reaching the server, so the user can undo.
 * While pending, the patient is hidden from every list.
 */
type Pending = { timer: ReturnType<typeof setTimeout>; commit: (options: { keepalive: boolean }) => void };

const pending = new Map<string, Pending>();
const listeners = new Set<() => void>();
let snapshot: ReadonlySet<string> = new Set();

function emit() {
  snapshot = new Set(pending.keys());
  listeners.forEach((listener) => listener());
}

export function scheduleDelete(id: string, delayMs: number, commit: Pending["commit"]) {
  cancelDelete(id);
  const timer = setTimeout(() => {
    pending.delete(id);
    emit();
    commit({ keepalive: false });
  }, delayMs);
  pending.set(id, { timer, commit });
  emit();
}

/** Returns true if the delete was still pending (and is now cancelled). */
export function cancelDelete(id: string) {
  const entry = pending.get(id);
  if (!entry) return false;
  clearTimeout(entry.timer);
  pending.delete(id);
  emit();
  return true;
}

// Closing or leaving the tab sends pending deletes right away instead of dropping them.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const [id, entry] of pending) {
      clearTimeout(entry.timer);
      pending.delete(id);
      entry.commit({ keepalive: true });
    }
  });
}

export function usePendingDeletes() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
    () => snapshot,
  );
}
