import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Static export emits app.html for a route named "app" unless this is on
  // — Capacitor's local asset server resolves "/app" as a directory lookup
  // for index.html, not the file-with-extension form, so without this a
  // hard load or deep link into /app 404s inside the Android WebView.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
