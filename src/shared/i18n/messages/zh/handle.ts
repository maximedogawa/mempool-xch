import type { Translation } from "../../translate";
import type en from "../en/handle";

const messages: Translation<(typeof en)["messages"]> = {
  status: {
    active: "已注册",
    expired: "已过期",
    unknown: "未注册",
    syncing: "注册表同步中",
    unavailable: "注册表无法访问",
  },
  invalidTitle: "不是有效的域名（handle）",
  invalidDescription:
    "XCHandles 域名由 3 到 63 个小写字母和数字组成，写作 @name，不含点或连字符。收到：{raw}",
  empty: "（空）",
  mainnetTitle: "域名是主网注册表",
  mainnetDescription: "XCHandles 仅在主网运行。请将网络切换回主网以解析域名。",
  title: "域名",
  artAlt: "{handle} 的名称 NFT",
  handle: "域名",
  resolvesTo: "解析到",
  nobodyRegistered: "尚无人注册此域名。",
  noAddress: "没有可解析到的地址。",
  expired: "已过期",
  expires: "到期",
  nameNft: "名称 NFT",
  ownerLauncherId: "持有者 launcher ID",
  syncing: "注册表索引落后于链上状态，宁可如实告知也不使用过时数据作答。请稍后重试。",
  unreachable: "无法访问 XCHandles 注册表。",
  retry: "重试",
  registry: "注册表",
  lastAction: "最近操作",
  confirmedIn: "确认于",
  block: "区块 {height}",
  protocolFee: "协议费",
  protocolFeeValue: "{fee} <faint>mojo（支付所用 CAT）</faint>",
  notRegisteredTitle: "{handle} 尚未注册",
  notRegisteredDescription: "注册表中没有有效槽位解析此域名。可在 xchandles.com 上注册。",
  openOnXchandles: "在 XCHandles 上打开",
};

export default messages;
