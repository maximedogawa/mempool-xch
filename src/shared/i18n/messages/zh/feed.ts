import type { Translation } from "../../translate";
import type en from "../en/feed";

const messages: Translation<typeof en> = {
  latestTransactions: "最新交易",
  paused: "已暂停",
  mempoolLink: "内存池 →",
  empty: "内存池为空。",
  costTitle: "成本 {cost}",
  zeroFee: "0 手续费",
  feeRate: "{rate} m/c",
  firstSeenTitle: "mempoolxch.space 服务器首次观察到的时间（并非网络首次发现的时间）",
  latestBlocks: "最新区块",
  blocksLink: "区块 →",
  txBlock: "交易区块",
  noTx: "无交易",
};

export default messages;
