import type { Metadata } from "next";
import { MapPage } from "@/widgets/map/MapPage";

export const metadata: Metadata = { title: "Network map" };

export default function Page() {
  return <MapPage />;
}
