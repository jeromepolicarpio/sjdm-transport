import { FarePendingBanner } from "@/components/FarePendingBanner";
import { MapShell } from "@/components/MapShell";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function Home() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FarePendingBanner />
      <OfflineBanner />
      <MapShell />
    </div>
  );
}
