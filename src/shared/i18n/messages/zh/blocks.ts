import type { Translation } from "../../translate";
import type en from "../en/blocks";

const messages: Translation<(typeof en)["messages"]> = {
  row: {
    label: "区块",
    projected: "预计 · 下一批区块",
    confirmed: "已确认 · 最近的交易区块",
  },
  projected: {
    emptyLabel: "内存池为空：下一个区块将不包含交易",
    empty: "空",
    mempool: "内存池",
    listLabel: "预计的下一批区块",
    cubeLabel:
      "预计区块 {n}：{bundles}{yours}{watched}，已满 {percent}%，费率 {min} 至 {max} mojo/成本，{eta}",
    bundles: { other: "{count} 个花费包" },
    yoursPart: "，其中 {count} 个是您的",
    watchedPart: "，{count} 个已关注",
    nextBlock: "下一个区块",
    zeroFee: "0 手续费",
    txCount: "{count} 笔交易 · {cost}",
    yours: "您的 {count} 笔",
    inEta: "{eta}后",
  },
  details: {
    title: "预计区块 {n} · {bundles} · 成本 {cost} · {eta}",
    bundles: { other: "{count} 个花费包" },
    close: "关闭",
    closeLabel: "关闭预计区块详情",
    txId: "交易 ID",
    kind: "类型",
    fee: "手续费",
    cost: "成本",
    feePerCost: "手续费 / 成本",
    value: "价值",
    seen: "发现时间",
    showingFirst: "显示前 {shown} 个，共 {total} 个。<link>打开完整的内存池表格</link>。",
  },
  recent: {
    listLabel: "最近的交易区块",
    cubeLabel: "区块 {height}{watched}，{age}，手续费 {fees}，{farmer}",
    watchedPart: "，{count} 个已关注",
    farmedByPool: "由 {pool} 耕种",
    farmerHash: "农民 {hash}",
    totalFees: "手续费总额",
    moved: "转移 {amount}",
    rewardClaims: { other: "{count} 笔奖励领取" },
    poolTitle: "{pool} · 农民 {hash}",
    farmerTitle: "农民 {hash}",
    gap: {
      other: "{newer} 与 {older} 之间有 {count} 个非交易区块（不包含花费）",
    },
    empty: "最近的时间窗口内没有交易区块（每个成本上限 {cost}）。",
  },
  reorgs: {
    title: "重组历史",
    hint: "重组会用一条竞争链替换最近的一个或多个区块。Chia 的重组通常只有一个区块深，且无害；被重组区块中的交易只会在稍后一个区块中被重新打包。",
    mostRecent: "最近 {count} 次，由 Coinset 检测",
    empty: "暂无重组记录。",
    detected: "检测时间",
    depth: "深度",
    rolledBackTo: "回滚至",
    oldPeak: "旧最新高度",
    newPeak: "新最新高度",
    depthValue: { other: "{count} 个区块" },
    from: "原 #{height}",
  },
};

export default messages;
