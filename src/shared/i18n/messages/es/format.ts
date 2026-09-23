import type { Translation } from "../../translate";
import type en from "../en/format";

const messages: Translation<typeof en> = {
  justNow: "ahora mismo",
  secondsAgo: "hace {s} s",
  minutesAgo: "hace {m} min",
  hoursAgo: "hace {h} h {m} min",
  daysAgo: "hace {d} d {h} h",
  monthsAgo: "hace {mo} meses",
  yearsAgo: "hace {y} años",
  nextBlock: "próximo bloque",
  etaSeconds: "~{s} s",
  etaMinutes: "~{m} min",
  etaHours: "~{h} h",
  durationSeconds: "{s} s",
  durationMinutes: "{m} min {s} s",
  durationHours: "{h} h {m} min",
};

export default messages;
