import type { Translation } from "../../translate";
import type en from "../en/status";

const messages: Translation<typeof en> = {
  title: "状态",
  tooltip:
    "此刻从您的浏览器测量，方式与页面获取数据相同。没有服务器端监控，也没有历史记录；红色行表示您的连接目前无法访问该服务。",
  health: {
    ok: "正常",
    degraded: "降级",
    down: "无法访问",
    checking: "检查中",
  },
  overall: {
    ok: "所有服务均可访问",
    degraded: "部分服务缓慢或降级",
    down: "部分服务无法访问",
  },
  checked: "{age}检查 · 每分钟重新检查",
  checking: "检查中…",
  checkAgain: "重新检查",
  services: "服务",
  serviceList: "服务状态",
  latency: "{ms} 毫秒",
  names: {
    coinsetRpc: "Coinset 全节点 RPC",
    ownNode: "您的节点（全节点 RPC）",
    indexed: "Coinset 索引 API",
    live: "实时数据流",
    dns: "Chia DNS 引导节点",
  },
  what: {
    noIndexed: "自定义节点不可用",
    pollingOnly: "仅轮询",
    viaDns: "通过 cloudflare-dns.com",
  },
  detail: {
    synced: "已同步 · 最新高度 #{height}",
    notSynced: "未同步 · 最新高度 #{height}",
    lastReorg: "上次重组 {age}",
    answering: "正常响应",
    dexie: "代币注册表正常响应",
    mintgarden: "NFT API 正常响应",
    seeder: { other: "{seeder}：{count} 个节点" },
    geo: "地理定位正常响应",
    geoNoLocation: "已响应但未返回位置",
  },
  live: {
    state: {
      live: "实时",
      polling: "轮询",
      connecting: "连接中",
      offline: "离线",
    },
    websocket: "{state}（WebSocket）",
    viaPolling: "{state}（轮询）",
    lastEvent: " · 最近事件 {age}",
    peak: " · 最新高度 #{height}",
  },
  footnote:
    "网站本身是由 mempoolxch.space 提供的静态应用（健康检查端点 <code>/up</code>）；其他所有数据都由您的浏览器从上述服务获取。Coinset 会独立于本页面发布其自身状态。",
};

export default messages;
