"use client";

import { useState, useEffect } from "react";

export function useSectionHint(hintKey: string): {
  isDismissed: boolean;
  dismiss: () => void;
} {
  // Default true = SSR-safe: card is hidden on server, revealed after hydration if needed
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(`hint_dismissed_${hintKey}`);
    setIsDismissed(stored === "1");
  }, [hintKey]);

  function dismiss() {
    localStorage.setItem(`hint_dismissed_${hintKey}`, "1");
    setIsDismissed(true);
  }

  return { isDismissed, dismiss };
}
