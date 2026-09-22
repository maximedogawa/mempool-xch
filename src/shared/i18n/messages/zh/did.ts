import type { Translation } from "../../translate";
import type en from "../en/did";

const messages: Translation<typeof en> = {
  title: "个人资料",
  mainnetOnly: "个人资料和 NFT 持有数据来自 MintGarden，它仅索引主网。",
  avatarAlt: "DID 头像",
  unnamed: "未命名资料",
  verified: "已验证",
  noProfile: "此 DID 没有 MintGarden 个人资料。它仍可能持有 MintGarden 尚未索引的 NFT。",
  nftsHeld: { other: "持有 {count} 个 NFT" },
  website: "网站",
  collectionsHeld: "持有的系列",
  more: "另有 {count} 个",
};

export default messages;
