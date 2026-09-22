import type { Translation } from "../../translate";
import type en from "../en/blocktime";

const messages: Translation<typeof en> = {
  title: "出块时间",
  hint: "Chia 大约每 18.75 秒产出一个区块，但只有约三分之一包含交易。进度条会一直计到交易区块之间的预期间隔。",
  sinceLast: "距上一个交易区块",
  expectedGap: "预期间隔",
  progressLabel: "距预期下一个交易区块的进度",
  avgBlock: "平均出块",
  seconds: "{seconds} 秒",
  txBlocks: "交易区块",
  observedGap: "实测间隔",
  netspace: "全网空间",
  pushedTitle: "由 Coinset 推送于 {age} · 难度 {difficulty}",
  fromState: "来自 get_blockchain_state",
  footer: {
    other: "最新高度 {peak} · 上一个交易区块 {last} · 窗口 {count} 个区块",
  },
  reorgRecent: { other: "重组 {age}（{count} 个区块，位于 #{height}）" },
  reorgLast: { other: "上次重组 {age}（{count} 个区块，位于 #{height}）" },
};

export default messages;
