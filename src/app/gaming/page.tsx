import type { Metadata } from "next";
import { ArcadePage } from "@/widgets/arcade/ArcadePage";

export const metadata: Metadata = { title: "Arcade" };

export default function Page() {
  return <ArcadePage />;
}
