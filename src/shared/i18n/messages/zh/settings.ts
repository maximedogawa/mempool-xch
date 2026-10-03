import type { Translation } from "../../translate";
import type en from "../en/settings";

const messages: Translation<(typeof en)["messages"]> = {
  title: "设置",
  channel: "<strong>实时通道：{name}。</strong>{detail} 所有数据均直接从端点读取。",
  network: {
    title: "网络",
    active: "当前网络",
    intro:
      "整个应用都跟随当前网络：地址前缀、区块浏览器链接、实时数据流和内存池摘要。当前端点：<endpoint>{url}</endpoint>",
  },
  endpoints: {
    title: "全节点 RPC 端点",
    sage: "<strong>在 Sage 中：</strong>您的余额、币和交易来自钱包本身。Sage 的应用桥不提供节点 RPC（无法查询最新高度、内存池或区块），因此全链数据来自下方的端点；保存自定义端点时会在 Sage 中将其加入白名单。",
    intro:
      "默认情况下，mempoolxch.space 直接在你的浏览器中通过公共 nodexch 网关 <strong>nodexch.space</strong> 读取链数据，无需自己的节点。若它无响应，读取会自动切换到 <coinset>Coinset</coinset> 的公共全节点 RPC，恢复后再切回。你也可以直接选择 Coinset，或为每个网络指定你自己的节点或网关。需要索引 API 的功能（语义化交易摘要、地址历史和 WebSocket 推送）在普通节点上会关闭，应用改为轮询并在浏览器中获取原始内存池。",
    ownNode:
      "<strong>使用自己的节点？</strong>标准的 Chia 全节点在 <code>https://localhost:8555</code> 上以双向 TLS 监听：它要求提供节点的客户端证书（浏览器无法提供），并且不发送 CORS 头。请在其前面放置一个小型反向代理，用客户端证书终止 TLS 并添加 <code>Access-Control-Allow-Origin</code>，然后在此处用 IP 地址输入代理 URL，例如 <code>http://127.0.0.1:8556</code>：<code>localhost</code> 可能解析为 IPv6，从而连不到监听 127.0.0.1 的代理。<guide>分步指南</guide>。",
    nodexch:
      "<strong>nodexch？</strong>nodexch 网关在其自有全节点之前使用 Coinset 的接口方式：全节点 RPC、索引 API 和 WebSocket 位于同一主机。选择预设，或将您自己的网关标记为 nodexch；每次调用都会附带一个绑定到本站来源的可公开密钥（<code>nxp_…</code>）。切勿在此输入秘密密钥。",
  },
  endpoint: {
    addresses: "（{prefix} 地址）",
    coinsetDefault: "Coinset 默认",
    customNode: "自定义节点",
    test: "测试连接",
    save: "保存",
    reset: "恢复默认",
    ok: "最新高度 {height}，耗时 {ms} 毫秒",
    syncing:
      "节点仍在同步：已到 {height} / {tip}（{percent}%）。同步完成前，区块和内存池数据会滞后。",
    syncingNoTip: "节点仍在同步：同步完成前，区块和内存池数据会滞后。",
    okCustom:
      "最新高度 {height}，耗时 {ms} 毫秒 · 自定义节点：索引 API、WebSocket 和摘要 API 已关闭",
    sageHttpsOnly: "在 Sage 中只能将 https 端点加入白名单。",
    sageRefused: "Sage 未允许此主机；端点未保存。",
    sageAllowed: "Sage 已允许此主机。",
    nodexch: "nodexch",
    nodexchToggle: "此端点是 nodexch 网关",
    apiKey: "可公开密钥",
    apiKeyHint: "nxp_…（使用 api.nodexch.space 预设时可选）",
    apiKeyInvalid: "浏览器中只能使用可公开密钥（nxp_…）。",
    okNodexch: "峰值 {height}，耗时 {ms} ms · nodexch：索引 API 和 WebSocket 已开启",
    providers: "提供方",
    pickNodexch: "nodexch.space",
    pickNodexchHint: "默认 · Coinset 自动备用",
    pickCoinset: "Coinset",
    pickCoinsetHint: "公共全节点 RPC",
    pickOwn: "自己的节点",
    pickOwnHint: "本地节点或你自己的网关",
    nodexchDefault: "默认：nodexch.space",
    fallback: "nodexch.space 无响应（{reason}）：在其恢复前改从 Coinset 读取。",
  },
  appearance: {
    title: "外观",
    theme: "主题",
    dark: "深色",
    darkHint: "墨色与夜钢",
    light: "浅色",
    lightHint: "矿物浅色（默认）",
    midnight: "午夜",
    midnightHint: "原版海军蓝与绿色，带光泽",
    system: "系统",
    systemHint: "跟随设备",
    sageLocked: "在 Sage 中，应用跟随钱包的主题（当前为{theme}）。请在 Sage 的设置中更改。",
    language: "语言",
    languageAuto: "自动（浏览器语言）",
    chime: "确认提示音",
    chimeHint: "当您钱包中的交易被打包进区块时，播放轻柔的硬币声（仅限 Sage）。",
    recentBlocks: "概览中的最近区块数",
  },
  resetAll: "重置所有设置",
};

export default messages;
