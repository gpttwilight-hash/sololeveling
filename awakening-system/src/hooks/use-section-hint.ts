"use client";

import { useCallback, useSyncExternalStore } from "react";

function getStorageKey(hintKey: string) {
  return `hint_dismissed_${hintKey}`;
}

export function useSectionHint(hintKey: string): {
  isDismissed: boolean;
  dismiss: () => void;
} {
  const key = getStorageKey(hintKey);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) onStoreChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [key]
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(key) === "1";
  }, [key]);

  // SSR-safe: card is hidden on server, revealed after hydration if needed
  const getServerSnapshot = useCallback(() => true, []);

  const isDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    localStorage.setItem(key, "1");
    // Trigger re-render by dispatching a storage event
    window.dispatchEvent(new StorageEvent("storage", { key }));
  }, [key]);

  return { isDismissed, dismiss };
}
