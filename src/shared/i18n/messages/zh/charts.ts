import type { Translation } from "../../translate";
import type en from "../en/charts";

const messages: Translation<typeof en> = {
  title: "图表",
  tooltipCoinset:
    "数据序列按需从 Coinset 生成——我们的服务器不存储任何数据。尚无提供方能提供的序列不会列出。",
  tooltipCustom:
    "数据序列按需从您配置的端点生成——我们的服务器不存储任何数据。尚无提供方能提供的序列不会列出。",
  sections: {
    market: "市场",
    mempool: "内存池",
    blocks: "区块",
    network: "网络",
  },
  card: {
    latest: "最新",
    average: "平均",
    highest: "最高",
    points: "数据点",
    notEnoughData: "数据尚不足。",
    definition: "定义与技术说明",
  },
  controls: {
    range: "范围",
    smoothing: "平滑",
    scale: "刻度",
    linear: "线性",
    log: "对数",
  },
  notes: {
    sampledOnly: "此浏览器仅采样最近 2 小时；请选择 6h 或 24h 查看。",
    sameSample: "与「已用成本」相同的 2 小时浏览器采样。",
    perWindow: "按每个采样窗口从 get_block_records 统计。",
    noNetspace: "此端点不可用：get_network_space 未对此端点作出响应。",
  },
  price: {
    title: "XCH 价格（USDT）",
    definition: "XCH/USDT 现货价格随时间的变化：每根 K 线的收盘价。",
    technical:
      "来自 Gate.io 公开的 XCH_USDT 现货 K 线，每个时间范围请求一次（6h 使用 5 分钟 K 线，「全部」使用周线）。USDT 与美元紧密挂钩，但并不等同于美元。",
    unavailable: "Gate.io 的价格历史未响应。数据直接从此浏览器获取，请稍后重试。",
  },
  costUsed: {
    title: "已用成本",
    definition: "所有待确认花费包的 CLVM 总成本。",
    technical: "每次内存池摘要刷新时在此浏览器中采样；保留 2 小时。",
    unavailable: "此浏览器仅采样最近 2 小时（Coinset 没有内存池历史端点）；请选择 6h 或 24h 查看。",
  },
  waitingBundles: {
    title: "等待中的花费包",
    definition: "停留在内存池中的花费包。",
  },
  totalFees: {
    title: "手续费总额",
    definition: "所有待确认花费包所提供手续费的总和。",
  },
  medianFeeRate: {
    title: "费率中位数",
    definition:
      "位于待确认成本中点的费率：内存池中一半的待确认成本支付的费率高于它，另一半低于它。",
    technical:
      "与其他内存池序列一同在此浏览器中采样：花费包按费率（每单位成本的 mojo）排序，取累计达到待确认总成本一半处的费率。按成本加权，因此少数大型免费花费会把它拉向 0。",
  },
  feesPerTxBlock: {
    title: "每个交易区块的手续费",
    definition: "一个交易区块中支付的平均手续费总额。",
    technical:
      "按每个采样窗口从 get_block_records（block_record.fees）求平均；无论范围大小，窗口数量都有上限。",
  },
  costPerTxBlock: {
    title: "每个交易区块的成本",
    definition: "一个交易区块使用的 CLVM 成本（每个区块上限为 110 亿）。",
    technical:
      "取每个采样窗口中最新的交易区块：get_block 返回的 transactions_info.cost。每个窗口一个区块（每个时间范围 6 到 24 个），每个区块每次会话只获取一次。",
  },
  txBlocksPerHour: {
    title: "每小时交易区块数",
    definition: "窗口内有多少区块包含交易。",
  },
  spendsPerTxBlock: {
    title: "每个交易区块的花费数",
    definition: "一个交易区块中被花费的币的数量。",
    technical:
      "与「每个交易区块的成本」使用相同的采样区块：get_additions_and_removals 返回的 removals 数量。奖励领取是新创建的币，并未被花费，因此不计入。",
  },
  shareOfTxBlocks: {
    title: "交易区块占比",
    definition: "交易区块占全部区块的比例（约三分之一）。",
  },
  timeBetweenTxBlocks: {
    title: "交易区块间隔时间",
    definition: "相邻交易区块之间的平均间隔。",
    technical: "按每个采样窗口根据 get_block_records 的时间戳求平均。",
  },
  netspace: {
    title: "全网空间（Netspace）",
    definition: "估算的全网耕种总空间。",
    technical:
      "对每个采样窗口的首尾区块调用 get_network_space——这是节点自身基于难度的估算，并非由我们推导。",
  },
  difficulty: {
    title: "难度",
    definition: "耕种区块时所用的空间证明难度。",
    technical:
      "来自其他序列已获取的区块记录：区块的权重（weight）是链的累计难度，因此相邻高度之间的权重差就是该区块的难度。按采样窗口取中位数。难度每个纪元（4,608 个区块）调整一次。",
  },
  blocksPerHour: {
    title: "每小时区块数",
    definition: "每小时的全部区块（含交易区块与非交易区块）。",
  },
};

export default messages;
