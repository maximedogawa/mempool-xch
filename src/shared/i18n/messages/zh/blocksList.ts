import type { Translation } from "../../translate";
import type en from "../en/blocksList";

const messages: Translation<typeof en> = {
  title: "区块",
  peak: "最新高度 {height}",
  txOnly: "仅交易区块",
  loadError: "无法加载区块",
  height: "高度",
  type: "类型",
  age: "时间",
  rewardClaims: "奖励领取",
  fees: "手续费",
  xchMoved: "转移的 XCH",
  pool: "矿池",
  headerHash: "区块头哈希",
  txBlock: "交易区块",
  noTx: "无交易",
  poolTitle: "{pool} · 收款 {hash}",
  heights: "高度 {from} – {to}",
  updating: " · 更新中…",
  newer: "较新",
  latest: "最新",
  older: "较旧",
};

export default messages;
