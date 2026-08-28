import type { StyleSpecification } from "maplibre-gl";

// Path the bundled archive is served from (public/tiles/ -> static export
// root -> Capacitor www assets). Shared with CityMap.tsx, which registers a
// matching BundledPMTilesSource under this same key before the style below
// is ever applied.
export const OFFLINE_PMTILES_URL = "/tiles/sjdm.pmtiles";

// Vector basemap built locally with Planetiler's default OpenMapTiles-schema
// profile (docs/HANDOFF.md §6/§10) and shipped in the app bundle as
// public/tiles/sjdm.pmtiles. No font glyphs are bundled, so this style is
// deliberately label-free — geometry only, enough for offline orientation.
export const OFFLINE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    offline: {
      type: "vector",
      url: `pmtiles://${OFFLINE_PMTILES_URL}`,
      // Required by the OpenMapTiles schema license these vector tiles are
      // built to (CC-BY, via Planetiler) — see docs/HANDOFF.md §10.
      attribution:
        '&copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#f2efe9" },
    },
    {
      id: "landcover",
      type: "fill",
      source: "offline",
      "source-layer": "landcover",
      paint: { "fill-color": "#d8e8d0", "fill-opacity": 0.6 },
    },
    {
      id: "park",
      type: "fill",
      source: "offline",
      "source-layer": "park",
      paint: { "fill-color": "#c8e6c0", "fill-opacity": 0.6 },
    },
    {
      id: "water",
      type: "fill",
      source: "offline",
      "source-layer": "water",
      paint: { "fill-color": "#a7cbe8" },
    },
    {
      id: "waterway",
      type: "line",
      source: "offline",
      "source-layer": "waterway",
      paint: { "line-color": "#a7cbe8", "line-width": 1 },
    },
    {
      id: "building",
      type: "fill",
      source: "offline",
      "source-layer": "building",
      paint: { "fill-color": "#ded9d0" },
    },
    {
      id: "transportation",
      type: "line",
      source: "offline",
      "source-layer": "transportation",
      // Roads only — the same source-layer also carries rail/ferry/aerialway,
      // which would otherwise render as indistinguishable white lines.
      filter: [
        "in",
        ["get", "class"],
        [
          "literal",
          [
            "motorway",
            "trunk",
            "primary",
            "secondary",
            "tertiary",
            "minor",
            "service",
            "track",
          ],
        ],
      ],
      paint: {
        "line-color": [
          "match",
          ["get", "class"],
          ["motorway", "trunk"],
          "#f2b26b",
          ["primary", "secondary", "tertiary"],
          "#f5d98b",
          "#ffffff",
        ],
        "line-width": [
          "interpolate",
          ["linear"],
          ["zoom"],
          8,
          [
            "match",
            ["get", "class"],
            ["motorway", "trunk"],
            0.8,
            ["primary", "secondary", "tertiary"],
            0.5,
            0.2,
          ],
          15,
          [
            "match",
            ["get", "class"],
            ["motorway", "trunk"],
            4,
            ["primary", "secondary", "tertiary"],
            2.5,
            1,
          ],
        ],
      },
    },
    {
      id: "boundary",
      type: "line",
      source: "offline",
      "source-layer": "boundary",
      paint: { "line-color": "#b7a9c9", "line-width": 0.6 },
    },
  ],
};
