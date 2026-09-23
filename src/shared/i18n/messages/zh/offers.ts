import type { Translation } from "../../translate";
import type en from "../en/offers";

const messages: Translation<typeof en> = {
  status: {
    open: "未成交",
    pending: "成交中",
    confirmed: "已成交",
    cancelPending: "取消中",
    cancelled: "已取消",
    expired: "已过期",
  },
  nothing: "无",
  card: {
    title: "报价",
    statusGroup: "报价状态",
    emptyAddress: {
      open: "没有以此地址为挂单方的未成交报价记录。",
      confirmed: "没有以此地址为挂单方的已成交报价记录。",
      cancelled: "没有以此地址为挂单方的已取消报价记录。",
      expired: "没有以此地址为挂单方的已过期报价记录。",
      pending: "没有以此地址为挂单方的成交中报价记录。",
    },
    emptyAsset: {
      open: "该资产没有已索引的未成交报价。",
      confirmed: "该资产没有已索引的已成交报价。",
      cancelled: "该资产没有已索引的已取消报价。",
      expired: "该资产没有已索引的已过期报价。",
      pending: "该资产没有已索引的成交中报价。",
    },
    trade:
      "<muted>提供</muted> <offered></offered> <arrow></arrow> <muted>换取</muted> <requested></requested>",
    by: "挂单方 <maker></maker>",
    details: "详情",
    loading: "加载中…",
    loadMore: "加载更多",
  },
  page: {
    invalidTitle: "不是有效的报价 ID",
    invalidDescription: "应为 32 字节的十六进制报价 ID。收到：{raw}",
    empty: "（空）",
    needsCoinsetTitle: "报价需要 Coinset",
    needsCoinsetDescription:
      "报价索引属于 Coinset 的索引 API，自定义节点不具备该功能。请在<link>设置</link>中将端点切换回 Coinset 以查询报价。",
    notIndexedTitle: "报价未被索引",
    notIndexedDescription:
      "Coinset 未见过此 ID 的报价。报价在发布后（例如在 Dexie 上）或在接受或取消它的花费进入内存池后才会被索引；从未分享过的报价文件无法按 ID 查询。",
    loadError: "无法加载报价",
    retry: "重试",
    heading: "报价",
    status: "状态",
    canBeTaken: "仍可被接受",
    takeInMempool: "接受操作在内存池中",
    cancelInMempool: "取消操作在内存池中",
    firstSeen: "首次发现",
    cancelled: "已取消",
    taken: "已成交",
    expires: "到期",
    beforeHeight: "#{height} 之前",
    setByMaker: "由挂单方设定",
    noExpiry: "未设置到期",
    fee: "手续费",
    offeredByMaker: "由挂单方支付",
    trade: "交易内容",
    makerOffers: "挂单方提供",
    makerRequests: "挂单方要求",
    makerAddresses: { other: "挂单方地址" },
    unknown: "未知。",
    settlement: "结算",
    takenIn: "已在交易 <tx></tx> 中成交。",
    takenInBlock: "已在区块 <block>#{height}</block> 的交易 <tx></tx> 中成交。",
    cancelledBy: "已被交易 <tx></tx> 取消。",
    cancelledByBlock: "已被区块 <block>#{height}</block> 中的交易 <tx></tx> 取消。",
    beingTaken: "正在被交易 <tx></tx> 接受。",
    beingTakenBlock: "正在被区块 <block>#{height}</block> 中的交易 <tx></tx> 接受。",
    notSettled: "链上尚无任何交易接受或取消此报价。",
    noOfferFile:
      "Coinset 只索引报价状态而不保存报价文件，因此本页无法将其交给钱包。请在 <link>Dexie</link> 上查找并接受。",
  },
};

export default messages;
