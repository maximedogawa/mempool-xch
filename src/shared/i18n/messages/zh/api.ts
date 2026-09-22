import type { Translation } from "../../translate";
import type en from "../en/api";

const messages: Translation<typeof en> = {
  title: "API 参考",
  titleHint:
    "mempoolxch.space 没有自己的服务器 API：您看到的每个页面都像本应用一样，直接从您的浏览器读取链上端点。本页记录了应用自身发出的调用，方便您也能针对 Coinset 的公共端点或您自己的节点发出同样的调用。",
  coinsetOnly: "仅限 Coinset",
  anyFullNode: "任意全节点",
  showExample: "显示示例",
  hideExample: "隐藏示例",
  base: {
    title: "基础 URL",
    intro:
      "下面的每个方法都是向 <code>{base}/{method}</code> 发送的 <code>POST</code> 请求，带 JSON 请求体，无需认证，CORS 开放。全节点 RPC 与 Coinset 的索引 API 使用同一主机。",
    mainnet: "主网：",
    testnet: "Testnet11：",
    websocket: "WebSocket（最新高度和交易事件）：",
    specs:
      "完整的 OpenAPI 规范：<code>coinset.org/openapi/full_node_bundled.json</code> 和 <code>coinset.org/openapi/coinset_bundled.json</code>。标记为「任意全节点」的端点也适用于您自己的节点，参见<link>设置 → 自定义节点</link>。",
  },
  groups: {
    chain: "链与内存池",
    blocks: "区块",
    transactions: "交易（索引，仅限 Coinset）",
    coins: "币（coin）",
    balances: "余额与资产（索引，仅限 Coinset）",
    offers: "报价、回拨与重组（索引，仅限 Coinset）",
  },
  endpoints: {
    get_blockchain_state: "最新高度和哈希、内存池大小和成本、区块最大成本、难度、同步状态。",
    get_fee_estimate: "针对一个或多个目标确认时间的每单位成本手续费估算。",
    get_all_mempool_tx_ids: "当前内存池中所有花费包（spend bundle）的 id。",
    get_all_mempool_items:
      "所有待确认花费包的完整内容。数据量大（数十 MB）；应用会与已有的 id 做差异比对，而不是整体重新获取。",
    get_mempool_item_by_tx_id: "按 id 获取一个待确认花费包。",
    get_mempool_items_by_coin_name: "涉及某个币的待确认花费包。",
    get_network_space: "两个区块头哈希之间的估算全网空间。",
    get_block_records: "某高度范围内的区块记录，不含终点。Coinset 限制单次调用最多 1,000 条记录。",
    get_block_record_by_height: "按高度获取一条区块记录。",
    get_block_record: "按区块头哈希获取一条区块记录。",
    get_block: "按区块头哈希获取完整区块（生成器信息、奖励领取）。",
    get_block_spends: "区块中的币花费（自定义节点下币流向的备用方案）。",
    get_additions_and_removals: "区块中创建和移除的币，用于币流向视图。",
    get_block_transactions: "区块中已确认交易的语义摘要，分页。",
    get_transaction: "按花费包 id 获取一条语义交易摘要。",
    get_transactions_by_p2: "某地址谜题哈希的交易历史，分页，最新在前。",
    get_pending_transactions_by_p2: "某地址的待确认交易。",
    get_transactions_by_cat_asset_id: "某 CAT 资产 id 的交易历史，分页。",
    get_transactions_by_nft_id: "某 NFT 的交易历史。",
    get_transactions_by_coin_name: "创建某个币的交易，以及（若已花费）移除它的交易。",
    get_coin_record_by_name: "按币 id 获取一条币记录。",
    get_coin_records_by_names: "按币 id 列表获取币记录。",
    get_coin_records_by_puzzle_hash: "支付给某谜题哈希的币记录。",
    get_coin_records_by_hint: "按备注提示（hint）获取币记录（钱包正是这样找到自己的币）。",
    get_coin_records_by_parent_ids: "由一组父币 id 创建的币记录。",
    get_puzzle_and_solution: "花费某个币时使用的 reveal 和 solution。",
    get_memos_by_coin_name: "附加在某个币花费上的备注字符串。",
    get_coin_details: "币的语义信息（类型、资产 id），前提是 Coinset 能够识别。",
    push_tx: "向内存池提交一个花费包。",
    get_xch_balance_by_p2: "某谜题哈希已确认和待确认的 XCH 余额。",
    get_cat_balances_by_p2: "某谜题哈希的 CAT 余额。",
    get_nft_balance_by_p2: "某谜题哈希持有的 NFT 数量。",
    get_singleton_info: "按 launcher id 获取单例（NFT/DID）的沿袭记录。",
    get_latest_nft_coin_by_nft_id: "某 NFT 当前未花费的币。",
    get_offer: "按 id 获取某个报价的生命周期状态：双方资产、发起方，以及接受或取消它的交易。",
    get_offers_by_p2: "某谜题哈希发出的报价，每次调用查询一种生命周期状态。",
    get_offers_by_cat_asset_id: "提供或求购某 CAT 的报价。",
    get_offers_by_nft_id: "提供或求购某 NFT 的报价。",
    get_clawback_coins_by_receiver:
      "发送到某谜题哈希的可回拨（clawback）币，包括时间锁以及发送方是否仍可撤回。",
    get_reorgs: "Coinset 检测到的链重组，最新在前。",
    get_raw_transaction_by_id:
      "某花费包的内存池格式条目（币花费、新增、移除），即使它已离开内存池也可获取。",
  },
  otherData: {
    title: "其他数据",
    dexie:
      "CAT 名称、代码和图标来自 Dexie 的公共注册表：<code>GET https://api.dexie.space/v1/assets?type=cat</code>（分页，每页 100 条），图标位于 <code>https://icons.dexie.space/{asset_id}.webp</code>。",
    mintgarden:
      "NFT 元数据和图片来自 MintGarden：<code>GET https://api.mintgarden.io/nfts/{nft1_id}</code>。",
  },
  embeds: {
    title: "嵌入组件与徽章",
    theme: "嵌入主题",
    dark: "深色",
    light: "浅色",
    intro:
      "适用于矿池、钱包和社区网站的即插即用组件。每个组件都是一个小型静态页面（脚本不到 15 KB，无框架），直接从访问者的浏览器获取 Coinset 数据，因此不会有任何访问者信息到达我们这里。<code>?theme=dark|light</code> 选择配色，<code>&network=testnet11</code> 切换网络。可从任意来源嵌入。",
    preview: "预览",
    items: {
      blocks: {
        title: "区块队列",
        what: "预计的下一批区块和最近三个交易区块。",
      },
      fees: {
        title: "手续费卡片",
        what: "节点对下一个区块、约 5 分钟和约 10 分钟的手续费估算。",
      },
      mempool: {
        title: "内存池占用",
        what: "等待中的花费包、已用节点容量的成本、总手续费。",
      },
      tx: {
        title: "交易状态",
        what: "某个交易 id 的待确认、已确认或已移除状态。",
      },
    },
    badgeTitle: "SVG 徽章",
    badgeWhat:
      "shields 风格的图片，适用于 README 和无法运行脚本的页面；由 mempoolxch.space 提供，缓存一分钟。",
  },
  fairUse: {
    title: "速率限制与合理使用",
    limits:
      "这些是 Coinset、Dexie 和 MintGarden 的端点，不是我们的：我们无法设定它们的速率限制，截至目前它们也未公布任何限制。请合理使用：缓存已获取的数据，在端点允许时批量请求（例如 <code>get_block_records</code> 的高度范围，每次调用上限 1,000 条），轮询频率不要超过大约每个区块一次（主网约 18–20 秒）。",
    terms:
      "本网站本身仍受 mempoolxch.space 自己的<link>使用条款</link>约束（可用性、对此处加载页面的合理使用）；直接使用 Coinset、Dexie 或 MintGarden 则是您与它们之间的事。",
  },
};

export default messages;
