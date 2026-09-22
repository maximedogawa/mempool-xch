import type { Translation } from "../../translate";
import type en from "../en/search";

const messages: Translation<typeof en> = {
  label: "搜索交易、区块、地址、币和资产",
  placeholderLarge: "搜索交易、区块、地址、币、CAT 或 NFT…",
  placeholder: "搜索交易 ID、区块、地址、币、CAT 或 NFT…",
  clear: "清除搜索",
  submit: "搜索",
  go: "搜索",
  severalMatches: "有多个匹配结果，请选择一个",
  bestGuess: "最佳匹配",
  noMatches:
    "未找到「{query}」的匹配结果。请尝试准确的区块高度、交易 ID、地址、币 ID、nft1 ID、CAT 资产 ID 或 @handle。",
  invalid: {
    empty: "请输入要搜索的内容。",
    addressChecksum: "这看起来像一个地址，但校验和不正确。",
    nftChecksum: "这看起来像一个 NFT ID，但校验和不正确。",
    offerFile:
      "这是一个报价（offer）文件，而不是 ID。报价只有在发布后才有 ID：请先上传到 Dexie，然后搜索那里显示的报价 ID 或创建它的地址。",
    didChecksum: "这看起来像一个 DID，但校验和不正确。",
    hexLength: "十六进制 ID 必须为 32 字节（64 个十六进制字符）。",
  },
  match: {
    transaction: "交易",
    coin: "币",
    block: "区块 {height}",
    offer: "报价（{status}）",
    nft: "NFT",
    did: "DID",
    collection: "系列",
    cat: "CAT 资产",
    address: "地址（谜题哈希）",
    expiredHandle: "{handle}（已过期的域名）",
  },
};

export default messages;
