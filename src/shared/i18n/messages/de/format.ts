import type { Translation } from "../../translate";
import type en from "../en/format";

const messages: Translation<typeof en> = {
  justNow: "gerade eben",
  secondsAgo: "vor {s} s",
  minutesAgo: "vor {m} min",
  hoursAgo: "vor {h} h {m} min",
  daysAgo: "vor {d} T. {h} h",
  monthsAgo: "vor {mo} Mon.",
  yearsAgo: "vor {y} J.",
  nextBlock: "nächster Block",
  etaSeconds: "~{s} s",
  etaMinutes: "~{m} min",
  etaHours: "~{h} h",
  durationSeconds: "{s} s",
  durationMinutes: "{m} min {s} s",
  durationHours: "{h} h {m} min",
};

export default messages;
