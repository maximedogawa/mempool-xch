import type { Metadata } from "next";
import { NoticeContent } from "@/widgets/legal/NoticeContent";

export const metadata: Metadata = { title: "Legal notice" };

export default function NoticePage() {
  return <NoticeContent />;
}
