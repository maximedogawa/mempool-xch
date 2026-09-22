import type { Translation } from "../../translate";
import type en from "../en/ui";

const messages: Translation<typeof en> = {
  copy: "复制",
  copyToClipboard: "{label}到剪贴板",
  yours: "您的",
  capacity: {
    label: "内存池容量",
    costOf: "成本 {used} / {max}",
    blocks: "{percent} · {filled}/{segments} 个区块",
    valueText: "成本 {used} / {max}，{percent}",
  },
  kind: {
    xch: "XCH",
    cat: "CAT",
    nft: "NFT",
    did: "DID",
    offer: "报价",
    pool: "矿池",
    singleton: "单例",
    unknown: "未知",
  },
  summaryKind: {
    transfer: "转账",
    swap: "兑换",
    mint: "铸造",
    melt: "熔毁",
    combine: "合并",
    split: "拆分",
    pool: "矿池",
    revoke: "撤销",
    clawback: "追回",
    unknown: "未知",
  },
  status: {
    pending: "待确认",
    confirmed: "已确认",
    removed: "已丢弃",
    unknown: "未知",
  },
  image: {
    noImage: "{alt}（无图片）",
    reason: "原因：",
    video: "视频",
    showAnyway: "仍然显示",
    clickToShow: "{summary}——点击显示",
    veiled: "{alt}：{summary}",
    veiledButton: "{alt}：{summary}。仍然显示。",
  },
  cat: {
    unknown: "未知 CAT · 0x{id}",
  },
  chart: {
    notEnough: "数据尚不足。",
    collecting: "正在收集样本……历史记录从打开应用时开始。",
    lineSummary: {
      other: "{label}。从 {from} 到 {to} 共 {count} 个数据点。最新值 {latest}。",
    },
    stackedSummary: {
      other: "{label}。从 {from} 到 {to} 共 {count} 个样本。最新合计 {latest}。",
    },
    total: "合计 {value}",
  },
};

export default messages;
