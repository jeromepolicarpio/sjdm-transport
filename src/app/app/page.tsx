import type { Metadata } from "next";

import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Map",
  alternates: {
    canonical: "/app/",
  },
};

export default function AppPage() {
  return <AppShell />;
}
