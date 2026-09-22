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
    coinSet: "币集",
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
    noCoinset:
      "Coinset 的索引 API 没有用于此项的聚合端点（已对照其 OpenAPI 规范核实）；未来的提供方（如 nodexch）可能会添加。",
    needsCoinsetAggregate: "需要 Coinset 的聚合端点。",
    sampledOnly: "此浏览器仅采样最近 2 小时；请选择 6h 或 24h 查看。",
    sameSample: "与「已用成本」相同的 2 小时浏览器采样。",
    perWindow: "按每个采样窗口从 get_block_records 统计。",
    noNetspace: "此端点不可用：get_network_space 未对此端点作出响应。",
  },
  price: {
    title: "XCH 价格（USD）",
    definition: "XCH/USD 现货价格随时间的变化。",
    technical: "将来自 Dexie 的价格数据。",
    unavailable:
      "尚无经过验证的公开价格历史端点。连接后，Sage 钱包会在页眉显示实时现货价格；此图表需要历史数据，而 Dexie 目前没有公布有文档的相应端点。",
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
    definition: "待确认花费包费率的中位数。",
    technical: "浏览器采样器尚未记录此项（它只保存各费率区间的总计，而非完整分布）。",
    unavailable: "尚未采样：内存池历史只保存各费率区间的总计，不足以还原中位数。",
  },
  feesPerTxBlock: {
    title: "每个交易区块的手续费",
    definition: "一个交易区块中支付的平均手续费总额。",
    technical:
      "按每个采样窗口从 get_block_records（block_record.fees）求平均；无论范围大小，窗口数量都有上限。",
  },
  costPerTxBlock: {
    title: "每个交易区块的成本",
    definition: "一个交易区块中使用的平均 CLVM 成本。",
    technical:
      "未按图表尺度采样：精确成本需要为每个区块完整调用一次 get_block，没有服务器端缓存时对整个范围采样过于繁重。请在各区块自己的页面查看其精确成本。",
    unavailable:
      "未按图表尺度采样——每个区块都需要一次完整获取。请在各区块自己的页面查看其精确成本。",
  },
  txBlocksPerHour: {
    title: "每小时交易区块数",
    definition: "窗口内有多少区块包含交易。",
  },
  spendsPerTxBlock: {
    title: "每个交易区块的花费数",
    definition: "一个交易区块中被花费的币的平均数量。",
    technical:
      "未按图表尺度采样：需要为每个区块进行一次索引或 additions/removals 获取，没有服务器端缓存时对整个范围采样过于繁重。请在各区块自己的页面查看其花费。",
    unavailable: "未按图表尺度采样——每个区块都需要一次获取。请在各区块自己的页面查看其花费。",
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
    title: "全网算力（Netspace）",
    definition: "估算的全网耕种总空间。",
    technical:
      "对每个采样窗口的首尾区块调用 get_network_space——这是节点自身基于难度的估算，并非由我们推导。",
  },
  difficulty: {
    title: "难度",
    definition: "节点当前的空间证明难度目标。",
    technical:
      "没有经过验证的方法能从 get_block_records 还原历史难度；get_blockchain_state 只报告当前值。",
    unavailable:
      "无法在不使用未经验证的计算的情况下从现有端点推导——错误的数字比没有更糟。get_blockchain_state 会在设置页显示当前值。",
  },
  blocksPerHour: {
    title: "每小时区块数",
    definition: "每小时的全部区块（含交易区块与非交易区块）。",
  },
  unspentCoins: {
    title: "未花费的币",
    definition: "尚未花费的币的总数。",
  },
  activePuzzleHashes: {
    title: "活跃谜题哈希",
    definition: "持有币的不同谜题哈希数量。",
  },
  coinAge: {
    title: "币龄",
    definition: "未花费币的平均存在时间。",
  },
};

export default messages;
