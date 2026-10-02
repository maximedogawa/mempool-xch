import type { Translation } from "../../translate";
import type en from "../en/prefarm";

const messages: Translation<(typeof en)["messages"]> = {
  title: "预挖（prefarm）追踪",
  tooltip:
    "Chia Network 在第一个区块之前创建了 2100 万 XCH。这些币存放在四个托管金库中（冷金库和温金库，位于美国和瑞士），并有公开的审计规则。此页面直接从链上读取金库的币，不做任何估算。",
  mainnetOnly: "预挖金库仅存在于主网；请切换网络以查看。",
  tracked: "链上已追踪",
  trackedSub: "占 {total} XCH 预挖的 {percent}",
  trackedHint: "四个金库的单例币与其已知谜题哈希上未花费币的总和。",
  cold: "冷金库",
  coldSub: "90 天追回期托管",
  warm: "温金库",
  warmSub: "24 小时追回期托管",
  elsewhere: "不在这些地址上",
  elsewhereSub: "已花费、已出售，或转移到此页面未知的地址",
  elsewhereHint:
    "自 2021 年以来，预挖资金用于购买、做市和资助，而金库更换密钥（rekey）会改变其谜题哈希。凡不在已知地址上的资金都列在这里，不作猜测。",
  tier: {
    cold: "冷",
    warm: "温",
  },
  readError: "目前无法读取此金库的币。",
  coins: { other: "{count} 个币" },
  lastMovement: " · 最近变动 {age}",
  custody: "托管",
  launcher: "Launcher",
  singletonAt: "· 单例币位于 #{height}",
  addresses: "地址",
  footnote:
    "金库 launcher ID 取自 Chia Network 为其审计工具公布的数据（<alert>prefarm-alert</alert>）；托管规则见<guide>预挖审计指南</guide>。金库更换密钥会将资金转移到新的谜题哈希；发生这种情况时，此处余额会下降，直到新地址被加入，因此「不在这些地址上」的数值会单独显示，而不是并入总额。",
};

export default messages;
