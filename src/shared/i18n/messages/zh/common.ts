import type { Translation } from "../../translate";
import type en from "../en/common";

const messages: Translation<typeof en> = {
  channel: {
    customName: "轮询（自定义节点）",
    customDetail: "每隔几秒轮询您位于 {host} 的节点；无实时推送，内存池在浏览器中获取。",
    offlineName: "离线",
    offlineDetail: "无法连接到 {host}。",
    socketName: "Coinset WebSocket",
    socketDetail: "直接从 {host} 接收最新高度和交易事件。",
    reconnectingName: "Coinset WebSocket（重新连接中）",
    reconnectingDetail: "正在重新连接到 {host}。",
    pollingName: "轮询",
    pollingDetail: "每隔几秒轮询 {host}。",
  },
  rpcError: {
    network: "无法连接到节点。请检查您的网络连接或所配置的端点。",
    http: "节点返回了 HTTP {status}。",
    httpUnknown: "节点返回了 HTTP 错误。",
    malformed: "节点返回的响应无法解析。",
    notFound: "未找到。",
    aborted: "请求已取消。",
  },
  assets: {
    nfts: { other: "{count} 个 NFT" },
    dids: { other: "{count} 个 DID" },
    singletons: { other: "{count} 个单例（singleton）" },
    poolClaims: { other: "{count} 笔矿池领取" },
  },
  sensitivity: {
    title: "敏感内容",
    summary: "{title}。原因：{reason}",
  },
  pending: {
    broadcast: "已发送到网络，尚未出现在内存池中",
    waiting: "在内存池中，排在预计区块之后",
    nextBlock: "下一个区块 · 第 {position} 位，共 {size} 笔",
    projectedBlock: "预计区块 {block} · 第 {position} 位，共 {size} 笔",
    confirmed: "已确认",
    gone: "钱包中已不再待确认",
  },
  expiry: {
    lessThanDay: "不到一天",
    days: { other: "{count} 天" },
    months: { other: "{count} 个月" },
    years: { other: "{count} 年" },
    ago: "{span}前",
    in: "{span}后",
  },
  range: {
    all: "全部",
  },
  smoothing: {
    raw: "原始",
    smooth: "平滑",
    verySmooth: "高度平滑",
  },
  vaults: {
    coldUs: "冷钱包（美国）",
    coldCh: "冷钱包（瑞士）",
    warmUs: "温钱包（美国）",
    warmCh: "温钱包（瑞士）",
    custodyCold: "90 天追回期（clawback），30 天提取时间锁",
    custodyWarm: "24 小时追回期（clawback），1 小时提取时间锁",
  },
};

export default messages;
