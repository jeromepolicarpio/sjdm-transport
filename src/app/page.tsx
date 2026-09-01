import { RootGate } from "@/components/RootGate";
import { puvRoutes } from "@/data/puv-routes";

export default function Home() {
  // Counting server-side and passing just the number keeps the full route
  // dataset (barangay names etc.) out of RootGate's client bundle — see
  // LandingPage's puvRouteCount prop.
  return <RootGate puvRouteCount={puvRoutes.length} />;
}
