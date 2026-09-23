import type { Translation } from "../../translate";
import type en from "../en/app";

const messages: Translation<typeof en> = {
  invalidCoin: {
    title: "无效的币 ID",
    description: "币 ID 为 32 字节的十六进制，可带或不带 0x 前缀。",
  },
  invalidTx: {
    title: "无效的交易 ID",
    description: "交易（花费包）ID 为 32 字节的十六进制，可带或不带 0x 前缀。",
  },
  noBlock: {
    title: "未选择区块",
    description: "请搜索区块高度或区块头哈希。",
  },
};

export default messages;
