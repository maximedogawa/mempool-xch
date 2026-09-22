import type { Translation } from "../../translate";
import type en from "../en/pools";

const messages: Translation<typeof en> = {
  title: "矿池",
  group: {
    selfPooled: "自建矿池的农民",
    unnamed: "未命名矿池",
    unknown: "未知",
    everyoneElse: "其他",
  },
  bar: {
    label: "最近 {count} 个区块的份额：{summary}",
  },
  stats: {
    blocks: "区块",
    heights: "高度 {start} – {end}",
    largest: "最大",
    largestHint: "时间窗口内最大的单个分组。",
    named: "已命名矿池",
    namedSub: "{blocks} 个区块 · {pools} 个矿池",
    namedHint:
      "登记在册的矿池所赢得的份额，每个矿池都经其自身 pool_info 端点或其他有记录的来源确认。",
    payouts: "收款地址",
    payoutsSub: "分布在 {count} 个分组中",
    payoutsHint:
      "时间窗口内赢得区块的不同矿池收款地址。每个 PlotNFT 农民都有自己的地址，因此一个矿池拥有很多地址。",
  },
  share: {
    title: "各矿池份额",
    search: "搜索矿池或地址",
    loadError: "无法加载矿池份额",
    noClaims:
      "奖励领取数据来自 Coinset 的索引 API，自定义节点不提供该 API：因此这里的 PlotNFT 农民逐个列出，而不是归入其矿池。",
    resolving: {
      other:
        "正在检查 {count} 个收款地址的奖励被领取到何处；随着结果返回，矿池会逐步归并。您的浏览器会为下次访问记住这些结果。",
    },
    noMatch: "没有与「{search}」匹配的矿池或地址。",
    colPool: "矿池",
    colPayouts: "收款地址",
    colBlocks: "区块",
    colShare: "份额",
    showTop: "只显示前 {count} 个",
    showAll: "显示全部 {count} 行",
  },
  row: {
    bothShares: "两份奖励",
    bothSharesHint:
      "每个区块的矿池奖励（7/8）和农民奖励（1/8）都发往同一地址，因此这不是官方矿池协议的 PlotNFT：而是单独耕种的农民，或使用自有协议的运营方。",
    claimsTo: "领取至 <hash></hash>",
    showFewer: "收起",
    more: "另有 {count} 个",
  },
  footnote:
    "区块的收款地址以及将其清空的领取交易都在链上，因此分组是精确的；只有名称来自登记表，并与矿池在其 <code>pool_info</code> 端点公布的目标地址进行匹配。奖励从未被领取的地址（新的 PlotNFT，或尚未归集的矿池）会一直显示为「未知」，直到被领取为止。知道缺少哪个矿池？请在 <code>src/shared/lib/pools/registry.json</code> 中添加一条附有来源的条目（参见 wiki 中的贡献说明）。",
};

export default messages;
