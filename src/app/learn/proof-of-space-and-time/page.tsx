import type { Metadata } from "next";
import { ProofOfSpaceAndTime } from "@/widgets/learn/articles/ProofOfSpaceAndTime";

export const metadata: Metadata = { title: "Proof of space and time" };

export default function Page() {
  return <ProofOfSpaceAndTime />;
}
