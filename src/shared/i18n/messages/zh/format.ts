import type { Translation } from "../../translate";
import type en from "../en/format";

const messages: Translation<typeof en> = {
  justNow: "刚刚",
  secondsAgo: "{s} 秒前",
  minutesAgo: "{m} 分钟前",
  hoursAgo: "{h} 小时 {m} 分钟前",
  daysAgo: "{d} 天 {h} 小时前",
  monthsAgo: "{mo} 个月前",
  yearsAgo: "{y} 年前",
  nextBlock: "下一个区块",
  etaSeconds: "约 {s} 秒",
  etaMinutes: "约 {m} 分钟",
  etaHours: "约 {h} 小时",
  durationSeconds: "{s} 秒",
  durationMinutes: "{m} 分 {s} 秒",
  durationHours: "{h} 小时 {m} 分",
};

export default messages;
