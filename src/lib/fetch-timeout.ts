const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Combines an optional caller-supplied AbortSignal with an internal timeout,
 * so a fetch aborts on whichever fires first. Shared by every external
 * service call in this app (osrm.ts, photon.ts) rather than each
 * reimplementing its own timeout/abort wiring.
 *
 * Deliberately NOT AbortSignal.any() — that static only landed in Safari
 * 17.4 (March 2024). Every browser on iOS (Safari, Chrome, Opera, ...) runs
 * on Apple's WebKit under the hood, so any iPhone below 17.4 throws
 * TypeError: AbortSignal.any is not a function from every one of them alike.
 * That throw happened outside the caller's own try/catch and was never
 * caught downstream, which is what left map-tap point picking stuck on
 * "Finding location…" forever on affected iPhones — see the incident this
 * comment was added for. Manual listener wiring works everywhere
 * AbortController itself does.
 */
export function withTimeoutSignal(
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): { signal: AbortSignal; clear: () => void } {
  const combinedController = new AbortController();
  const timeoutId = setTimeout(() => combinedController.abort(), timeoutMs);

  const onCallerAbort = () => combinedController.abort();
  signal?.addEventListener("abort", onCallerAbort);
  if (signal?.aborted) combinedController.abort();

  return {
    signal: combinedController.signal,
    clear: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onCallerAbort);
    },
  };
}
