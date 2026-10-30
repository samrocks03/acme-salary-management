/**
 * URL-as-state helpers. We write with the native History API (Next patches pushState/replaceState and
 * syncs them into useSearchParams; Back/Forward then restore the URL and components re-derive their state
 * from it) instead of router.push, because the client already owns the data — an RSC round-trip would only
 * prefetch it again.
 */
export type HistoryMode = "push" | "replace";

type HistoryWindow = {
  location: Pick<Location, "pathname" | "search">;
  history: Pick<History, "pushState" | "replaceState">;
};

/** Writes `url` (path + query) to history, skipping no-op writes so Back never has duplicate steps. */
export function writeUrl(url: string, mode: HistoryMode, win: HistoryWindow = window): void {
  if (url === `${win.location.pathname}${win.location.search}`) return;
  if (mode === "push") win.history.pushState(null, "", url);
  else win.history.replaceState(null, "", url);
}
