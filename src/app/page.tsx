import { CityMap } from "@/components/CityMap";
import { FarePendingBanner } from "@/components/FarePendingBanner";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function Home() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FarePendingBanner />
      <OfflineBanner />
      <div className="min-h-0 flex-1">
        <CityMap />
      </div>
    </div>
  );
}
