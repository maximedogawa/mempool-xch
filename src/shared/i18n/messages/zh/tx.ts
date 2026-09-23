import type { Translation } from "../../translate";
import type en from "../en/tx";

const messages: Translation<typeof en> = {
  heading: "交易",
  retry: "重试",
  notAvailable: "暂无",
  unknown: "未知",
  noId: {
    title: "缺少交易 ID",
    description: "请从概览中打开一笔交易，或将 ID 粘贴到搜索框中。",
  },
  loadError: "无法加载该交易",
  notFound: {
    title: "未找到交易",
    coinset:
      "内存池中没有该 ID 的待确认花费包（spend bundle），Coinset 也没有该 ID 的已确认或已丢弃交易。未经确认就被移出内存池的花费包不会被节点保留，因此无法显示。",
    customNode:
      "内存池中没有该 ID 的待确认花费包（spend bundle）。未经确认就被移出内存池的花费包不会被节点保留，因此无法显示。查询已确认交易需要 Coinset 端点；使用自定义节点时，请改为搜索币 ID。",
  },
  pendingInIndex: "索引中显示为待确认。正在等待节点提供花费包；每 10 秒检查一次。",
  rawJson: {
    show: "显示原始 JSON",
    hide: "隐藏原始 JSON",
    spendBundle: "花费包",
    summary: "交易摘要",
  },
  memos: {
    title: "备注（{count}）",
    binary: "二进制备注（可能是提示或谜题哈希）",
  },
  event: {
    title: "事件 {n}",
    via: "通过 {protocol}",
    participant: "参与方",
    sent: "发送",
    received: "接收",
    moreParticipants: {
      other: "……另有 {count} 个参与方（见原始 JSON）。",
    },
    leg: "分段 {n}",
    legSent: "发送",
    legReceived: "接收",
    minted: "铸造了 {type} <asset></asset>",
    melted: "熔毁了 {type} <asset></asset>",
  },
  summary: {
    title: "摘要",
    hint: "由 Coinset 索引器提供的语义解读：谁发送和接收了哪些资产。",
    noEvents: "该交易没有语义事件。",
  },
  stats: {
    fee: "手续费",
    zeroFeeSpend: "零手续费花费",
    cost: "成本",
    clvmCost: "{cost} CLVM 成本",
    costHint: "花费包的 CLVM 总成本；每个区块可容纳 110 亿成本。",
    feePerCost: "手续费 / 成本",
    mojoPerCost: "每单位成本的 mojo",
    projectedBlock: "预计区块",
    projectedPosition: "{eta} · 第 {position} 位，共 {total} 笔",
    notInSummary: "尚未进入汇总的内存池",
    projectedHint: "按每单位成本手续费将内存池打包成 110 亿成本的区块时，该花费包所在的位置。",
    block: "区块",
    dropped: "已丢弃",
    confirmations: {
      other: "{count} 个确认",
    },
    removedFromMempool: "已移出内存池",
    time: "时间",
    feeRate: "{rate} mojo / 成本",
    inferredCost: "由链上数据推断（无成本记录）",
    verdict: "评估",
  },
  pending: {
    line: "{coinSpends} · 移除 {removals} 个 → 新增 {additions} 个 · 花费 <amount></amount><assets></assets> · 实时更新；待确认期间每 10 秒刷新。",
    coinSpends: {
      other: "{count} 个币花费",
    },
    assets: {
      other: "资产",
    },
  },
  farmedBy: {
    line: "耕种者：<who></who> · <link>区块详情</link>",
    soloFarmer: "未识别的独立农民",
    unidentifiedPool: "位于 <address></address> 的未识别矿池",
  },
  firstSeen: "首次出现在内存池：{age}（{date}）。",
  waitedConfirming: "确认前等待了 {duration}——基于首次出现的采样，并非共识事实。",
  waitedRemoved: "被移除前等待了 {duration}——基于首次出现的采样，并非共识事实。",
  coins: "币",
  coinSpends: {
    title: "币花费（{count}）",
    inferredHint:
      "Coinset 从未在内存池中见过该花费包；这些花费是根据其所在区块重建的，因此手续费和成本以区块记录为准。",
    lineMempool:
      "花费 {spent} → 创建 {created} 个 · 成本 {cost} · 花费 <amount></amount> · 与内存池中所见一致",
    lineInferred:
      "花费 {spent} → 创建 {created} 个 · 成本 {cost} · 花费 <amount></amount> · 根据区块重建",
    coins: {
      other: "{count} 个币",
    },
  },
  flow: {
    inputs: "输入 · 移除",
    outputs: "输出 · 新增",
    none: "无",
    more: "……另有 {count} 个（见原始 JSON）。",
    coin: "币 <hash></hash>",
    srSummary:
      "{inputs} 个输入（共 {totalIn}）流向 {outputs} 个输出（共 {totalOut}）；手续费 {fee}。输入 {first}。",
  },
  verdict: {
    noCostLabel: "无成本记录",
    noCostDetail: "该摘要由链上数据推断，因此无法提供成本和费率。",
    share: "区块的 {percent}",
    noFeeLabel: "未支付手续费",
    noFeeDetail: "占用了{share}；农民免费打包了它，或者它足够小，本来就能放下。",
    paidDetail: "以此费率占用了{share}。",
  },
};

export default messages;
