import type { Translation } from "../../translate";
import type en from "../en/mempoolList";

const messages: Translation<(typeof en)["messages"]> = {
  spendBundles: "花费包",
  summarised: "已汇总 {count}",
  costUsed: "已用成本",
  costOf: "{used} / {max}",
  totalFees: "总手续费",
  updated: "更新时间",
  source: {
    server: "汇总 API",
    snapshot: "来自您上次访问，同步中",
    syncing: "首次同步进行中",
    node: "直接来自节点",
  },
  pendingTitle: "待确认花费包",
  updating: "更新中…",
  live: "实时",
  loadError: "无法加载内存池",
  emptyTitle: "内存池为空",
  emptyDescription: "所有花费包均已被打包进区块。",
  columns: {
    txId: "交易 ID",
    kind: "类型",
    value: "价值",
    feeRate: "手续费 / 成本",
    fee: "手续费",
    cost: "成本",
    age: "时长",
  },
  firstSeenTitle: "mempoolxch.space 服务器首次观察到的时间",
  showing: "显示 {total} 个中的 {shown} 个",
  showMore: "显示更多",
};

export default messages;
