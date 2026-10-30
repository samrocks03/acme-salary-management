import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` in the server-rendered HTML and during hydration, `true` once React owns the DOM.
 * Server-rendered forms use it to stay disabled until hydration: input typed into the static HTML
 * would otherwise be reset to `defaultValues` (or interleaved with it) when React hydrates.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
