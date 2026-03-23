import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSectionHint } from "@/hooks/use-section-hint";

// jsdom provides localStorage; reset between tests
beforeEach(() => {
  localStorage.clear();
});

describe("useSectionHint", () => {
  it("initializes with isDismissed=true for SSR safety, then syncs with localStorage", async () => {
    // Hook's useState initializes isDismissed=true (SSR-safe: card hidden on server)
    // useEffect then updates based on localStorage
    const { result } = renderHook(() => useSectionHint("test_key"));
    // After render/effect with no localStorage entry, isDismissed becomes false
    expect(result.current.isDismissed).toBe(false);
  });

  it("returns isDismissed=false after hydration when key is absent from localStorage", async () => {
    const { result } = renderHook(() => useSectionHint("test_key"));
    // After useEffect fires (hydration), key is absent → not dismissed
    await act(async () => {});
    expect(result.current.isDismissed).toBe(false);
  });

  it("returns isDismissed=true after hydration when key is already in localStorage", async () => {
    localStorage.setItem("hint_dismissed_test_key", "1");
    const { result } = renderHook(() => useSectionHint("test_key"));
    await act(async () => {});
    expect(result.current.isDismissed).toBe(true);
  });

  it("dismiss() sets the key in localStorage and updates isDismissed", async () => {
    const { result } = renderHook(() => useSectionHint("test_key"));
    await act(async () => {});
    expect(result.current.isDismissed).toBe(false);

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem("hint_dismissed_test_key")).toBe("1");
    expect(result.current.isDismissed).toBe(true);
  });
});
