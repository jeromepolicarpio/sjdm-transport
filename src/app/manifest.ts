import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    // Installed PWAs should open the tool, not the marketing page — same
    // reasoning as RootGate defaulting to the tool for the native app.
    start_url: "/app/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/sjdm-transport-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/sjdm-transport-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
