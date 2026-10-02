import type { Translation } from "../../translate";
import type en from "../en/fees";

const messages: Translation<(typeof en)["messages"]> = {
  cards: {
    title: "交易手续费",
    hint: "Chia 手续费按 CLVM 成本支付，而不是按字节。估算基于成本为 {cost} 的参考花费（一次典型的单笔 XCH 转账）。将每单位成本的 mojo 费率乘以您的花费成本即可得到手续费。",
    targets: {
      nextBlock: "下一个区块",
      fiveMinutes: "约 5 分钟",
      tenMinutes: "约 10 分钟",
    },
    mojoPerCost: "mojo/成本",
    notAvailable: "暂无",
    capacityAvailable: "容量充足。",
    zeroFeeAccepted: "接受 0 手续费的花费。",
    aboveToEnter: "需高于 {rate} mojo/成本才能进入。",
    nearCapacity: "接近满载。",
    fullMempool: "已满的内存池至少需要 5 mojo/成本，且只接受高于其可挤出的最便宜花费的交易。",
    paidAhead: "付费花费会排在 0 手续费积压之前。",
    lastBlock:
      "上一个交易区块共支付 {fees} 手续费，费率 {rate} mojo/成本 · 当前费率 {current} mojo/成本。",
  },
  page: {
    title: "手续费",
    intro:
      "节点对成本为 {cost} 的转账的估算、内存池当前的费率分布，以及常见花费类型按当前费率的费用。按需从 Coinset 读取，我们的服务器不存储任何数据。",
    nodeEstimate: "节点估算",
    withinMinutes: { other: "{count} 分钟内" },
    rateSub: "{rate} mojo/成本",
    estimateNote:
      "get_fee_estimate，成本 {cost}。不显示 USD 换算：目前尚无经过验证的公开价格历史接口（与 /charts 上的市场图表缺口相同）。",
    rateDistribution: "费率分布",
    pendingBundles: { other: "{count} 个待确认花费包" },
    colRate: "Mojo/成本",
    colBundles: "花费包",
    colCost: "成本",
    transferTitle: "一笔转账的费用",
    atCurrentRate: "按当前费率 {rate} mojo/成本",
    colSpend: "花费",
    colFee: "手续费",
    feesChart: {
      title: "每个交易区块的手续费",
      definition: "一个交易区块中支付的平均总手续费。",
      technical:
        "按采样窗口从 get_block_records（block_record.fees）求平均；无论时间范围多大，窗口数量都有上限。",
    },
    medianChart: {
      title: "费率中位数",
      definition: "区块内交易费率的中间值随时间的变化。",
      technical:
        "未按图表尺度采样：需要每个区块中每笔交易的成本（每个区块一次索引查询），在没有服务器端缓存的情况下跨时间范围采样开销过大。",
      unavailable:
        "未按图表尺度采样——需要对每个区块进行一次索引查询。内存池动态和交易页面中的花费包费率是精确的。",
    },
    footer: "其他位置显示的费率——内存池动态、交易页面和区块页面——都是逐项的精确数值，而非采样。",
  },
  transfers: {
    plain: "普通转账",
    threeInputs: "含 3 个输入的转账",
    cat: "发送 CAT",
    nft: "转移 NFT",
    offer: "接受报价",
  },
};

export default messages;
