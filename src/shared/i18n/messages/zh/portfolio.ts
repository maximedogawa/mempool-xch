import type { Translation } from "../../translate";
import type en from "../en/portfolio";

const messages: Translation<(typeof en)["messages"]> = {
  title: "投资组合",
  intro:
    "您的 Sage 钱包和关注列表中的地址持有什么、价值多少。代币价格为 Dexie 以 XCH 计的最新成交价，XCH/USD 为 Gate.io 的现货价格；数据不会离开您的浏览器。由于代币价格以 XCH 计价，24 小时变化表示 XCH 自身价格变动带来的价值变化。",
  sources: "来源",
  sourceAll: "全部合计",
  sourceSage: "Sage 钱包",
  emptyTitle: "暂无内容",
  emptyDescription:
    "在 Sage 钱包中打开 mempoolxch.space，或在仪表盘上将地址加入关注列表，其持仓就会显示在这里。",
  toDashboard: "前往仪表盘",
  needsIndexed: "地址余额需要 Coinset 的索引 API，所选节点不提供该接口。",
  loadError: "部分余额无法加载，数据可能不完整。",
  partial: "只读取了最近 {count} 笔 Sage 交易，因此更早变动过的代币可能缺失。",
  total: "总价值",
  totalXch: "≈ {value} XCH",
  noUsd: "暂无美元价格",
  changeHint:
    "XCH 自身价格变动（Gate.io）在 24 小时内带来的价值变化。代币价格以 XCH 计价，因此随之变动。",
  stats: {
    assets: "资产",
    assetsSub: "{priced} 个有价格",
    largest: "最大持仓",
    largestSub: "占价值的 {share}",
    unpriced: "无价格",
    unpricedSub: "不计入总额",
    unpricedNone: "所有资产均有价格",
    xchShare: "XCH 占比",
    xchShareSub: "{value} XCH",
  },
  allocation: "配置",
  allocationLabel: "投资组合价值按资产的配置",
  allocationEmpty: "目前没有持仓有市场价格，因此无法划分。",
  otherSlice: "其他（{count}）",
  holdings: "持仓",
  holdingsCount: "{count} 项资产",
  colAsset: "资产",
  colPrice: "价格",
  colAmount: "持有量",
  colValue: "价值",
  colShare: "占比",
  noPrice: "无价格",
  unknownToken: "未知代币",
  noHoldings: "此来源没有 XCH 或代币。",
  unavailable: "无法加载此来源的任何余额。",
};

export default messages;
