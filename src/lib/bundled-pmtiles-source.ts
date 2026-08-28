import type { RangeResponse, Source } from "pmtiles";

// Capacitor's local WebView asset server doesn't reliably honor HTTP Range
// requests, which the default pmtiles FetchSource depends on for random
// access into the archive — tile fetches fail with a bare "Failed to fetch"
// on-device (works fine in a normal browser, where Range is well-supported).
// The bundled archive is small (~15MB) and fully offline anyway, so instead
// fetch it once in full and serve all byte ranges from an in-memory buffer.
// This stops being reasonable if the archive grows into the tens of MB —
// at that point switch to downloading it once via Capacitor's Filesystem
// plugin (HANDOFF.md §6) and reading byte ranges from disk instead.
export class BundledPMTilesSource implements Source {
  private bufferPromise: Promise<ArrayBuffer> | null = null;

  constructor(private readonly url: string) {}

  getKey(): string {
    return this.url;
  }

  private load(): Promise<ArrayBuffer> {
    if (!this.bufferPromise) {
      this.bufferPromise = fetch(this.url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load bundled PMTiles archive: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .catch((error: unknown) => {
          // Don't cache a rejection — a transient failure would otherwise
          // permanently break every future tile request for this session.
          this.bufferPromise = null;
          throw error;
        });
    }
    return this.bufferPromise;
  }

  async getBytes(offset: number, length: number): Promise<RangeResponse> {
    const buffer = await this.load();
    return { data: buffer.slice(offset, offset + length) };
  }
}
