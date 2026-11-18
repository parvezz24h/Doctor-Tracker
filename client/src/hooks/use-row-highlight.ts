"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tracks the id of a row to flash after it was created or edited. */
export function useRowHighlight(duration = 1500) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const highlight = useCallback(
    (id: string) => {
      clearTimeout(timeoutRef.current);
      setHighlightedId(id);
      timeoutRef.current = setTimeout(() => setHighlightedId(null), duration);
    },
    [duration],
  );

  return { highlightedId, highlight };
}
