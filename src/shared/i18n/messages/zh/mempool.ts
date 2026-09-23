import type { Translation } from "../../translate";
import type en from "../en/mempool";

const messages: Translation<(typeof en)["messages"]> = {
  title: "内存池",
  viewAll: "查看全部 →",
  spendBundles: "花费包",
  summarised: "已汇总 {count}",
  summarisedSyncing: "已汇总 {count} · 同步中",
  spendBundlesHint: "节点报告的数量。重启后汇总仍在追赶时，汇总数量会在几秒内偏低。",
  costUsed: "已用成本",
  costUsedHint: "所有待确认花费包的 CLVM 总成本与节点内存池上限（10 个区块）之比。",
  totalFees: "总手续费",
  incoming: "流入",
  perMinute: "{rate}/分钟",
  lastTenMinutes: "最近 10 分钟",
  incomingHint: "最近十分钟内首次发现的花费包，按每分钟计。",
  chartLabel: "内存池成本随时间按费率区间分布",
  feeBands: "费率区间",
  bandLabel: "{band} mojo/成本",
  sampledSince: "自 {time} 起在此浏览器中采样（2 小时窗口）",
  historyStarts: "历史记录从首次打开应用时开始",
};

export default messages;
