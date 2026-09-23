import type { Translation } from "../../translate";
import type en from "../en/map";

const messages: Translation<(typeof en)["messages"]> = {
  title: "网络地图",
  titleHint:
    "本页所有数据均来自 Chia 公开发布的 Peer Info 仪表板快照。国家标记在代表性位置显示汇总的节点数量；无需浏览器爬虫，也不收集地址。",
  intro:
    "Chia 全节点分布在哪里、运行什么版本，以及网络此刻在做什么。搜索或选择一个地区来缩小地图范围，然后点击某个国家查看详情。",
  stats: {
    fullNodes: "全节点",
    fullNodesSub: "过去 5 天内可见",
    mainnetOnly: "仅限主网",
    fullNodesHint: "Chia Peer Info 仪表板在五天窗口内报告的全节点数量。",
    reliable: "稳定节点",
    reliableSub: "占网络的 {share}",
    reliableHint: "足够稳定、会被爬虫通过 DNS 引导节点分发出去的节点。",
    ipv6: "IPv6",
    ipv6Sub: { other: "{count} 个节点" },
    ipv6Hint: "爬虫通过 IPv6 触达的节点所占比例。一个节点可以同时响应两种协议。",
    countries: "国家",
    countriesSub: { other: "已定位 {count} 个节点" },
    countriesHint: "爬虫报告的国家，每个国家在地图上都有一个代表性位置。",
    concentration: "集中度",
    concentrationValue: { other: "{count} 个国家" },
    concentrationSub: "{country} 占 {share}",
    concentrationHint: "最大的几个国家合计需要多少个才能占据全部全节点的一半。",
    snapshot: "快照",
    snapshotSub: "最近观测",
    unavailable: "不可用",
    snapshotHint: "本页所依据的仪表板采集数据的时间。",
  },
  mapCard: {
    title: "Chia 全节点 · 实时",
    modelledReach: "模拟传播范围",
    zoomIn: "放大",
    zoomOut: "缩小",
    resetView: "重置地图视图",
    reset: "重置",
    searchLabel: "按国家或地区筛选地图",
    searchPlaceholder: "筛选地图：国家、代码或地区",
    suggestionNodes: { other: "{count} 个节点" },
    filteredSummary: "{shown} / {total} 个国家 · {nodes} 个节点（{share}）",
    summary: "{nodes} 个全节点 · {countries} 个国家",
    controls: "拖动平移 · 双击或 ⌘/ctrl + 滚轮缩放 · {scale}×",
    noMatch: "没有国家匹配「{query}」。",
  },
  worldMap: {
    label: "世界地图：{countries} 个国家中观测到的 {nodes} 个 Chia 节点",
    marker: {
      other: "{country}：{count} 个节点，排名第 {rank}",
    },
    peer: "已连接的对等节点 {host}，位于 {place} 附近",
  },
  activity: {
    title: "本节点看到的实时活动",
    counts: "{blocks} 个区块 · {bundles} 个花费包",
    waiting: "等待第一个事件…",
    newPeak: "新的最新高度 <link>#{height}</link>",
  },
  versions: {
    title: "节点版本",
    reporting: {
      other: "{count} 个节点报告了版本",
    },
    empty: "该快照不含版本面板。",
    note: "占比基于爬虫已知版本的 {reporting} 个节点（占总数的 {coverage}）。",
    noteNewest:
      "占比基于爬虫已知版本的 {reporting} 个节点（占总数的 {coverage}）；{newest} 是报告中最新的版本。",
  },
  regions: {
    title: "地区",
    action: "点击以筛选地图",
    names: {
      europe: "欧洲",
      asia: "亚洲",
      northAmerica: "北美洲",
      southAmerica: "南美洲",
      africa: "非洲",
      oceania: "大洋洲",
      unmapped: "未定位",
    },
  },
  reach: {
    title: "可达性",
    action: "五天爬虫窗口",
    ipv4: "IPv4",
    ipv6: "IPv6",
    reliable: "稳定节点",
    ipv4Hint: "过去五天内爬虫通过 IPv4 触达的节点。",
    ipv6Hint: "过去五天内爬虫通过 IPv6 触达的节点。",
    reliableHint: "足够稳定、会被爬虫通过 DNS 引导节点分发出去的节点。",
    overlap: "IPv4 和 IPv6 的占比有重叠：双栈节点在两者中都会计入，因此合计会超过节点总数。",
  },
  countries: {
    title: "国家",
    titleFiltered: "国家（已筛选）",
    action: "{countries} 个国家中的 {nodes} 个节点",
    noSnapshot: "该网络没有仪表板快照。",
    noMatch: "没有国家匹配当前筛选条件。",
    tableLabel: "国家",
    country: "国家",
    region: "地区",
    nodes: "节点",
    share: "占比",
    showTop: "仅显示前 {count} 个",
    showAll: "显示全部 {count} 个国家",
  },
  about: {
    title: "关于这张地图",
    shows:
      "<b>它显示什么。</b>来自 Chia Peer Info 仪表板的各国全节点数量（采集于 {age}），以及已配置节点的已连接对等节点。标记大小表示节点数量，颜色表示地区。",
    showsMainnet:
      "<b>它显示什么。</b>来自 Chia Peer Info 仪表板的各国全节点数量（针对主网采集），以及已配置节点的已连接对等节点。标记大小表示节点数量，颜色表示地区。",
    notShows:
      "<b>它不是什么。</b>Chia 不公布节点坐标，也不公布区块在哪里耕种或花费包来自何处。标记位于每个国家的一个代表性位置，传播弧线和脉冲是传播的模型，而不是数据包的路由。",
  },
  source:
    "来源：<link>Chia Peer Info 仪表板</link>，观测于 {observed} UTC。国家面板统计了节点总数面板所报告的 {total} 个节点中的 {placed} 个。只有节点地址会被发送到地理定位服务，访问者的地址绝不会发送。",
  sourceGap:
    "来源：<link>Chia Peer Info 仪表板</link>，观测于 {observed} UTC。国家面板统计了节点总数面板所报告的 {total} 个节点中的 {placed} 个；{gap} 个节点的差距来自两个独立的仪表板查询，而不是舍入误差。只有节点地址会被发送到地理定位服务，访问者的地址绝不会发送。",
  ownNodeHint: "在设置中指向您自己的节点，即可在这里同时看到它的已连接对等节点。",
  detail: {
    nodes: "节点",
    share: "占比",
    rank: "排名",
    region: "地区",
    yourPeers: "您的对等节点",
    note: "仪表板在代表性位置的估算，并非节点的实际位置。",
  },
  peers: {
    errorTitle: "无法读取连接",
    errorDescription: "您的节点未响应 get_connections。",
    none: "未报告任何对等连接。",
    title: "您节点的连接",
    action: {
      other: "{count} 个对等节点 · 每 15 秒刷新",
    },
    tableLabel: "连接",
    peer: "对等节点",
    type: "类型",
    location: "位置",
    network: "网络",
    peakHeight: "最新高度",
    sentReceived: "发送 / 接收",
    connected: "连接时间",
    unknownType: "类型 {type}",
    types: {
      fullNode: "全节点",
      harvester: "收割机（harvester）",
      farmer: "农民",
      timelord: "时间领主（timelord）",
      introducer: "引导节点",
      wallet: "钱包",
    },
  },
};

export default messages;
