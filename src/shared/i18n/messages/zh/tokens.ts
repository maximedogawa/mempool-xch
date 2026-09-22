import type { Translation } from "../../translate";
import type en from "../en/tokens";

const messages: Translation<typeof en> = {
  title: "代币",
  intro:
    "Dexie 注册表中有名称的所有 CAT，共 {total} 个。价格、交易量和流动性均为 Dexie 市场数据，统一以 XCH 计价以便相互比较：交易量是与该代币成交的 XCH，流动性是其未成交报价中的 XCH 一侧（每日更新）。一次请求即可获取所有代币的市场数据，我们的服务器不保存任何内容。链上历史请见各代币页面。",
  searchPlaceholder: "搜索名称、代码或资产 ID",
  searchLabel: "搜索代币",
  show: "显示",
  period: "周期",
  sort: "排序",
  windows: { d1: "24 小时", d7: "7 天", d30: "30 天" },
  filters: {
    traded: "有成交",
    tradedIn: "{window}内有成交",
    liquid: "有流动性",
    priced: "有价格",
    all: "全部",
  },
  sorts: { volume: "交易量", liquidity: "流动性", price: "价格", name: "名称" },
  marketsError: "Dexie 市场数据暂时不可用，因此缺少价格和交易量。",
  tryAgain: "重试",
  registryError: "无法加载代币注册表",
  noMatch: "当前视图中没有与「{query}」匹配的代币。",
  noTraded: {
    d1: "过去 24 小时内没有代币成交。",
    d7: "过去 7 天内没有代币成交。",
    d30: "过去 30 天内没有代币成交。",
  },
  showAll: "显示所有代币",
  colToken: "代币",
  colPrice: "价格（XCH）",
  colVolume: "{window}交易量（XCH）",
  colLiquidity: "流动性（XCH）",
  range: "第 {from}–{to} 个，共 {total} 个",
  previous: "上一页",
  next: "下一页",
};

export default messages;
