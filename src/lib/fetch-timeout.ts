const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Combines an optional caller-supplied AbortSignal with an internal timeout,
 * so a fetch aborts on whichever fires first. Shared by every external
 * service call in this app (osrm.ts, photon.ts) rather than each
 * reimplementing its own timeout/abort wiring.
 */
export function withTimeoutSignal(
  signal?: AbortSignal,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): { signal: AbortSignal; clear: () => void } {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  return {
    signal: signal
      ? AbortSignal.any([signal, timeoutController.signal])
      : timeoutController.signal,
    clear: () => clearTimeout(timeoutId),
  };
}
